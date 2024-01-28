import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { IUserData } from '../shared';

export const getTokenData = (req: Request): IUserData | null => {
   const authHeader = req.headers.authorization;
   const jwt = new JwtService()
   try {
      const token = authHeader.split(" ")[1];
      if (token) {
         return jwt.decode(token)
      }
   }
   catch (_) {/* */}
   return null
}
