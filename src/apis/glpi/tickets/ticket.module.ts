import { Module } from '@nestjs/common'

import { Ticket_Service } from '~tickets/ticket.service'
import { Ticket_Controller } from '~tickets/ticket.controller'


@Module({
   providers: [Ticket_Service],
   controllers: [Ticket_Controller],
   imports: [],
   exports: [Ticket_Service],
})
export class Ticket_Module {
}
