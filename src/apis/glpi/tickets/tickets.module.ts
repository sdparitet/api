import { Module } from '@nestjs/common'

import { TicketService } from '~tickets/ticket/ticket.service'
import { TicketController } from '~tickets/ticket/ticket.controller'
import { ListTicketService } from '~tickets/list/list.service'
import { ListTicketController } from '~tickets/list/list.controller'


@Module({
   providers: [TicketService, ListTicketService],
   controllers: [TicketController, ListTicketController],
   imports: [],
   exports: [TicketService, ListTicketService],
})
export class TicketModule {
}
