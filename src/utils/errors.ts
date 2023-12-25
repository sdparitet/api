import {
   BadRequestException,
   ConflictException,
   ForbiddenException,
   HttpException,
   HttpStatus,
   InternalServerErrorException,
   NotFoundException,
   UnauthorizedException,
} from "@nestjs/common";

export const catchErrors = async (history: History, e: any) => {
   {
      if (e instanceof UnauthorizedException)
         return Unauthorized(e.message);
      if (e instanceof NotFoundException)
         return NotFound(e.message);
      if (e instanceof BadRequestException)
         return BadRequest(e.message);
      return ServerError(e);
   }
}

export const ServerError = (e: any) => {
   console.log(e.stack || e);
   throw new InternalServerErrorException(e.response?.data?.message || e.message || e);
};

export const BadRequest = (msg: string) => {
   throw new BadRequestException(null, msg);
};

export const NotAcceptable = (msg: string) => {
   throw new HttpException({ statusCode: HttpStatus.NOT_ACCEPTABLE, message: msg }, HttpStatus.NOT_ACCEPTABLE);
};

export const NotFound = (msg?: string) => {
   throw new NotFoundException(null, msg || "User is not found");
};

export const NoRole = (msg?: string) => {
   throw new NotFoundException(null, msg || "The role was not found");
};

export const TokenExpired = () => {
   throw new UnauthorizedException(null, "Token expired");
};

export const Unauthorized = (msg: string) => {
   throw new UnauthorizedException(null, msg);
};

export const IncorrectToken = (msg: string) => {
   throw new ForbiddenException(null, msg);
};

export const AccessDenied = () => {
   throw new ForbiddenException(null, 'Access denied!');
};


export const Duplicate = (msg?: string) => {
   throw new ConflictException(null, msg || "Duplicate record");
};
