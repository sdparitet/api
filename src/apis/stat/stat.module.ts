import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';

import { Stat_Service } from '~stat/stat.service';
import { Stat_Controller } from '~stat/stat.controller';
import { Stat_Ticket } from '~stat/entity/ticket.entity';
import { STAT_DB_CONNECTION } from '~root/src/constants';
import { Stat_ALLTicket } from '~stat/entity/all_ticket.entity';
import { Stat_UserLogs } from '~stat/entity/user_logs.entity';

@Module({
   providers: [Stat_Service],
   controllers: [Stat_Controller],
   imports: [
      TypeOrmModule.forFeature([Stat_Ticket, Stat_ALLTicket, Stat_UserLogs], STAT_DB_CONNECTION)
   ],
   exports: [Stat_Service],
})
export class Stat_Module {}
