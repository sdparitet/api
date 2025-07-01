import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { Observable } from 'rxjs'
import { JwtService } from '@nestjs/jwt'
import { Reflector } from '@nestjs/core'

import { HAS_ROLES, NOT_ROLES } from './roles-auth.decorator'

import * as Errors from '../utils/errors'
import { JwtData } from '~root/src/types/jwt'


@Injectable()
export class AccessGuard implements CanActivate {
   public constructor(private jwtService: JwtService, private readonly reflector: Reflector) {
   }

   public canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
      try {
         const req = context.switchToHttp().getRequest()
         const authHeader = req.headers.authorization
         const bearer = authHeader.split(' ')[0]
         const token = authHeader.split(' ')[1]

         // Check authorization method
         if (bearer !== 'Bearer' || !token) {
            // noinspection ExceptionCaughtLocallyJS
            throw new UnauthorizedException()
         }

         // Check expiration
         const decodedToken = this.jwtService.decode(token)
         if (!decodedToken || !decodedToken.exp || (decodedToken.exp * 1000) <= (Date.now() / 1000)) {
            return Errors.TokenExpired() // Expired
         }

         const tokenData = this.jwtService.verify(token, { secret: process.env.SECRET })

         // Check Roles
         const requiredRoles = this.reflector.getAllAndOverride<string[]>(HAS_ROLES, [
            context.getHandler(),
            context.getClass(),
         ])
         const excludedRoles = this.reflector.getAllAndOverride<string[]>(NOT_ROLES, [
            context.getHandler(),
            context.getClass(),
         ])
         if (!requiredRoles && !excludedRoles) {
            return true
         }

         const required = requiredRoles && requiredRoles.length > 0 ? tokenData.userRoles.some((role: string) => requiredRoles.includes(role)) || false : true
         const excluded = excludedRoles && excludedRoles.length > 0 ? !tokenData.userRoles.some((role: string) => excludedRoles.includes(role)) || false : true
         const anyRole = requiredRoles && requiredRoles.length == 0 ? tokenData.userRoles.length > 0 || false : true

         //Add username for @Username decorator
         req.username = tokenData.userName


         if (anyRole && required && excluded) return true
         else return Errors.AccessDenied()

      } catch (e) {
         throw new ForbiddenException(e, 'Forbidden')
      }
   }
}
