import { Body, Controller, Header, Post } from "@nestjs/common";
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Roles } from '~guards/roles-auth.decorator';
import { GlobalRoles } from '~roles/All-roles';
import { GLPI_Roles } from '~roles/glpi.roles';
import { GLPI_Service } from '~glpi/glpi.service';
import {
   IGetUserTicketsRequestDto,
   IGetUserTicketsResponse,
   IGetUsersInTicketsByAuthorRequestDto,
   IGetUsersInTicketsByAuthorRequestResponse,
} from '~glpi/dto/post-request-dto';

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
   gut(@Body() dto: IGetUserTicketsRequestDto) {
      return this.glpiService.GetUserTickets(dto);
   }

   @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
   @Post("/GetUsersInTicketsByAuthor")
   @Header("content-type", "application/json")
   @ApiBody({ required: false, type: IGetUsersInTicketsByAuthorRequestDto })
   @ApiResponse({ type: [IGetUsersInTicketsByAuthorRequestResponse] })
   guitba(@Body() dto: IGetUsersInTicketsByAuthorRequestDto) {
      return this.glpiService.GetUsersInTicketsByAuthor(dto);
   }
}
