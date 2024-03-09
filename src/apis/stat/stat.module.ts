import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';

import { Stat_Service } from '~stat/stat.service';
import { Stat_Controller } from '~stat/stat.controller';
import { Stat_Ticket } from '~stat/entity/ticket.entity';
import { STAT_DB_CONNECTION } from '~root/src/constants';
import { Stat_ALLTicket } from '~stat/entity/all_ticket.entity';

@Module({
   providers: [Stat_Service],
   controllers: [Stat_Controller],
   imports: [
      TypeOrmModule.forFeature([Stat_Ticket, Stat_ALLTicket], STAT_DB_CONNECTION)
   ],
   exports: [Stat_Service],
})
export class Stat_Module {}
