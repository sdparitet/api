import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtService } from '@nestjs/jwt';
import { Staff_Category } from '~staff/entity/category.entity';
import { Staff_Group } from '~staff/entity/group.entity';
import { Staff_Position } from '~staff/entity/position.entity';
import { Staff_Stat } from '~staff/entity/stat.entity';
import { Staff_Service } from '~staff/staff.service';
import { Staff_Controller } from '~staff/staff.controller';
import { KPI_DB_CONNECTION } from '~root/src/constants';

@Module({
   providers: [Staff_Service, JwtService],
   controllers: [Staff_Controller],
   imports: [
      TypeOrmModule.forFeature([Staff_Category, Staff_Group, Staff_Position, Staff_Stat], KPI_DB_CONNECTION)
   ],
   exports: [Staff_Service],
})
export class Staff_Module {}
