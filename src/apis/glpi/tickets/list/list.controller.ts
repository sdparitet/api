import { ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GLPI_DB_CONNECTION } from '~src/constants'
import { Body, Controller, Get, Header, Param, Post, Query, Res } from '@nestjs/common'
import { Roles } from '~guards/roles-auth.decorator'
import { Portal_Roles } from '~roles/portal.roles'
import { GLPI_Roles } from '~roles/glpi.roles'
import { Ticket, TicketFieldEnum } from '~t_tickets/ticket-model'
import { Username } from '~decorators/jwt.username'
import { Response } from 'express'
import { GetTicketsMembersRequest, GetTicketsMembersRequestDto } from '~tickets/dto/post-request-dto'
import { ListTicketService } from '~tickets/list/list.service'
import { IGlpiSession } from '~t_tickets/types'


@ApiTags(GLPI_DB_CONNECTION)
@Controller('glpi/tickets/list')
export class ListTicketController {
   constructor(
      private glpiService: ListTicketService,
   ) {
   }

   @Roles([Portal_Roles.PORTAL_USERS, GLPI_Roles.GLPI_DATA])
   @Get('/GetGlpiSession')
   @Header('content-type', 'application/json')
   @ApiResponse({ type: [IGlpiSession] })
   ggs(@Username() username: string, @Res() res: Response) {
      return this.glpiService.GetGlpiSession(username, res)
   }

   @Roles([Portal_Roles.PORTAL_USERS, GLPI_Roles.GLPI_DATA])
   @Get('/GetUserTickets')
   @Header('content-type', 'application/json')
   @ApiQuery({
      name: 'fields',
      required: false,
      isArray: true,
      enum: TicketFieldEnum,
      description: `Массив требуемых полей заявки.<br><br>Всегда будут возвращены поля: \`id\`, \`title\`, \`status\`, \`type\`\n<br><br>Список доступных полей:<br>${Object.keys(TicketFieldEnum).filter(key => isNaN(Number(key))).join(', ')}`,
   })
   @ApiResponse({ type: [Ticket] })
   gut(@Username() username: string, @Query('fields') fieldsRaw: string | undefined, @Res() res: Response) {
      const fields: (keyof typeof TicketFieldEnum)[] = fieldsRaw ? fieldsRaw.split(',') as (keyof typeof TicketFieldEnum)[] : []
      return this.glpiService.GetUserTickets(username, fields, res)
   }

   @Roles([Portal_Roles.PORTAL_USERS, GLPI_Roles.GLPI_DATA])
   @Get('/GetUserAssignTickets')
   @Header('content-type', 'application/json')
   @ApiQuery({
      name: 'fields',
      required: false,
      isArray: true,
      enum: TicketFieldEnum,
      description: `Массив требуемых полей заявки.<br><br>Всегда будут возвращены поля: \`id\`, \`title\`, \`status\`, \`type\`\n<br><br>Список доступных полей:<br>${Object.keys(TicketFieldEnum).filter(key => isNaN(Number(key))).join(', ')}`,
   })
   @ApiResponse({ type: [Ticket] })
   guat(@Username() username: string, @Query('fields') fieldsRaw: string | undefined, @Res() res: Response) {
      const fields: (keyof typeof TicketFieldEnum)[] = fieldsRaw ? fieldsRaw.split(',') as (keyof typeof TicketFieldEnum)[] : []
      return this.glpiService.GetUserAssignTickets(username, fields, res)
   }

   @Roles([Portal_Roles.PORTAL_USERS, GLPI_Roles.GLPI_DATA])
   @Get('/GetUserAgreementsTickets')
   @Header('content-type', 'application/json')
   @ApiQuery({
      name: 'fields',
      required: false,
      isArray: true,
      enum: TicketFieldEnum,
      description: `Массив требуемых полей заявки.<br><br>Всегда будут возвращены поля: \`id\`, \`title\`, \`status\`, \`type\`\n<br><br>Список доступных полей:<br>${Object.keys(TicketFieldEnum).filter(key => isNaN(Number(key))).join(', ')}`,
   })
   @ApiResponse({ type: [Ticket] })
   guagt(@Username() username: string, @Query('fields') fieldsRaw: string | undefined, @Res() res: Response) {
      const fields: (keyof typeof TicketFieldEnum)[] = fieldsRaw ? fieldsRaw.split(',') as (keyof typeof TicketFieldEnum)[] : []
      return this.glpiService.GetUserAgreementsTickets(username, fields, res)
   }

   @Roles([Portal_Roles.PORTAL_USERS, GLPI_Roles.GLPI_DATA])
   @Get('/GetUserGroupsTickets')
   @Header('content-type', 'application/json')
   @ApiQuery({
      name: 'fields',
      required: false,
      isArray: true,
      enum: TicketFieldEnum,
      description: `Массив требуемых полей заявки.<br><br>Всегда будут возвращены поля: \`id\`, \`title\`, \`status\`, \`type\`\n<br><br>Список доступных полей:<br>${Object.keys(TicketFieldEnum).filter(key => isNaN(Number(key))).join(', ')}`,
   })
   @ApiResponse({ type: [Ticket] })
   gugt(@Username() username: string, @Query('fields') fieldsRaw: string | undefined, @Res() res: Response) {
      const fields: (keyof typeof TicketFieldEnum)[] = fieldsRaw ? fieldsRaw.split(',') as (keyof typeof TicketFieldEnum)[] : []
      return this.glpiService.GetUserGroupsTickets(username, fields, res)
   }

   @Roles([Portal_Roles.PORTAL_USERS, GLPI_Roles.GLPI_DATA])
   @Get('/GetCultureTickets')
   @Header('content-type', 'application/json')
   @ApiResponse({ type: [Ticket] })
   @ApiQuery({
      name: 'fields',
      required: false,
      isArray: true,
      enum: TicketFieldEnum,
      description: `Массив требуемых полей заявки.<br><br>Всегда будут возвращены поля: \`id\`, \`title\`, \`status\`, \`type\`\n<br><br>Список доступных полей:<br>${Object.keys(TicketFieldEnum).filter(key => isNaN(Number(key))).join(', ')}`,
   })
   gct(@Username() username: string, @Query('fields') fieldsRaw: string | undefined, @Res() res: Response) {
      const fields: (keyof typeof TicketFieldEnum)[] = fieldsRaw ? fieldsRaw.split(',') as (keyof typeof TicketFieldEnum)[] : []
      return this.glpiService.GetCultureTickets(username, fields, res)
   }

   @Roles([Portal_Roles.PORTAL_USERS, GLPI_Roles.GLPI_DATA])
   @Post('/GetTicketsMembers')
   @Header('content-type', 'application/json')
   @ApiBody({ required: true, type: GetTicketsMembersRequestDto })
   // @ApiResponse({ type: [Ticket] })
   gtm(@Username() username: string, @Body() dto: GetTicketsMembersRequestDto, @Res() res: Response) {
      return this.glpiService.GetTicketsMembers(username, dto, res)
   }
}
