import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const Username = createParamDecorator(
   (_data: unknown, ctx: ExecutionContext): string => {
      const request = ctx.switchToHttp().getRequest()
      return request.username
   },
)
