import { Body, Controller, Header, Post, Res } from "@nestjs/common";
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Roles } from '~guards/roles-auth.decorator';
import { GlobalRoles } from '~roles/All-roles';
import { GLPI_Roles } from '~roles/glpi.roles';
import { GLPI_Service } from '~glpi/glpi.service';
import {
   IGetUserTicketsRequestDto,
   IGetUserTicketsResponse,
   IGetUsersInTicketsByAuthorRequestDto,
   IGetUsersInTicketsByAuthorResponse, IGetTicketInfoResponse, IGetTicketInfoRequestDto,
} from '~glpi/dto/post-request-dto';
import { Response } from "express";

import { GLPI_DB_CONNECTION } from '~root/src/constants';

@ApiTags(GLPI_DB_CONNECTION)
@Controller("glpi")
export class GLPI_Controller {
   constructor(private glpiService: GLPI_Service) { }

   @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
   @Post("/GetUserTickets")
   @Header("content-type", "application/json")
   @ApiBody({ required: false, type: IGetUserTicketsRequestDto })
   @ApiResponse({ type: [IGetUserTicketsResponse] })
   gut(@Body() dto: IGetUserTicketsRequestDto, @Res() res: Response) {
      return this.glpiService.GetUserTickets(dto, res);
   }

   @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
   @Post("/GetUsersInTicketsByAuthor")
   @Header("content-type", "application/json")
   @ApiBody({ required: false, type: IGetUsersInTicketsByAuthorRequestDto })
   @ApiResponse({ type: [IGetUsersInTicketsByAuthorResponse] })
   guitba(@Body() dto: IGetUsersInTicketsByAuthorRequestDto, @Res() res: Response) {
      return this.glpiService.GetUsersInTicketsByAuthor(dto, res);
   }

   @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
   @Post("/GetTicketInfoByID")
   @Header("content-type", "application/json")
   @ApiBody({ required: false, type: IGetTicketInfoRequestDto })
   @ApiResponse({ type: [IGetTicketInfoResponse] })
   gtibi(@Body() dto: IGetTicketInfoRequestDto, @Res() res: Response) {
      return this.glpiService.GetTicketInfoByID(dto, res);
   }
}
