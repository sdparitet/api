import { Body, Controller, Header, Post, Req } from "@nestjs/common";
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '~guards/roles-auth.decorator';
import { GlobalRoles } from '~roles/All-roles';
import { Stat_Roles } from '~roles/stat.roles';
import { Stat_Service } from '~stat/stat.service';
import { Stat_RequestTicketDto } from '~stat/dto/post-request-dto';

import { STAT_DB_CONNECTION } from '~root/src/constants';

@ApiTags(STAT_DB_CONNECTION)
@Controller("stat")
export class Stat_Controller {
   constructor(private statService: Stat_Service) { }

   @Roles(Stat_Roles.STAT_USER, ...Object.values(GlobalRoles))
   @Post("/GetTickets")
   @Header("content-type", "application/json")
   ggs(@Req() req: Request, @Body() dto: Stat_RequestTicketDto) {
      return this.statService.GetTickets(req, dto);
   }
}
