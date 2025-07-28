import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Observable } from 'rxjs'
import * as Errors from '~utils/errors'
import { HAS_ROLES, NOT_ROLES, PUBLIC } from '~guards/roles-auth.decorator'


@Injectable()
export class AccessGuard implements CanActivate {
   public constructor(private jwtService: JwtService, private readonly reflector: Reflector) {
   }

   public canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
      try {
         const isPublic = this.reflector.getAllAndOverride<Array<string | string[]>>(PUBLIC, [
            context.getHandler(),
            context.getClass(),
         ])
         if (isPublic) return true

         const req = context.switchToHttp().getRequest()
         const authHeader = req.headers.authorization
         const bearer = authHeader.split(' ')[0]
         const token = authHeader.split(' ')[1]

         // region [ Check authorization method ]
         if (bearer !== 'Bearer' || !token) {
            // noinspection ExceptionCaughtLocallyJS
            throw new UnauthorizedException()
         }
         // endregion

         // region [ Check expiration ]
         const decodedToken = this.jwtService.decode(token)
         if (!decodedToken || !decodedToken.exp || (decodedToken.exp * 1000) <= (Date.now() / 1000)) {
            return Errors.TokenExpired() // Expired
         }
         // endregion

         const tokenData = this.jwtService.verify(token, { secret: process.env.SECRET })

         // region [ Add username for @Username decorator ]
         req.username = tokenData.userName
         // endregion

         // region [ Check Roles ]
         const requiredRoles = this.reflector.getAllAndOverride<Array<string | string[]>>(HAS_ROLES, [
            context.getHandler(),
            context.getClass(),
         ])
         const excludedRoles = this.reflector.getAllAndOverride<Array<string | string[]>>(NOT_ROLES, [
            context.getHandler(),
            context.getClass(),
         ])

         if (!requiredRoles && !excludedRoles) {
            return true
         }

         const userRoles = tokenData?.userRoles || []

         // region [ Excluded ]
         const isExcluded = excludedRoles
            ? excludedRoles.some(role =>
               typeof role === 'string'
                  ? userRoles.includes(role)
                  : Array.isArray(role)
                     ? role.every(_role => userRoles.includes(_role))
                     : false,
            )
            : false
         // endregion

         if (isExcluded) return false

         const anyRole = !requiredRoles || requiredRoles.length === 0 ? userRoles.length > 0 : true

         // region [ Required ]
         const hasRequiredRoles = requiredRoles
            ? requiredRoles.some((cond) =>
               typeof cond === 'string'
                  ? userRoles.includes(cond)
                  : Array.isArray(cond)
                     ? cond.every((r) => userRoles.includes(r))
                     : false,
            )
            : true
         // endregion


         if (anyRole && hasRequiredRoles) return true
         else return Errors.AccessDenied()
         // endregion
      } catch (e) {
         throw new ForbiddenException(e, 'Forbidden')
      }
   }
}
