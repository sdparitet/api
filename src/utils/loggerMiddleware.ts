import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {

   private loggerMW = new Logger('HTTP');

   use(request: Request, response: Response, next: NextFunction): void {
      const { ip, method, originalUrl } = request;
      const userAgent = request.get('user-agent') || '';

      response.on('error', err => {
         const { statusCode } = response;
         this.loggerMW.error(
            `${ip} : ${method} ${originalUrl} ${statusCode} - ${err.message} \n
            ${err.name}: \n`,
            err.stack
         );
      });

      response.on('finish', () => {
         const { statusCode, statusMessage } = response;
         const contentLength = response.get('content-length');

         this.loggerMW.log(
            ` ${ip} : ${method} ${originalUrl} ${statusCode} ${contentLength} - ${statusMessage || userAgent}`
         );
      });

      next();
   }
}
