import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtService } from '@nestjs/jwt';
import { Oup_Category } from '~arm/oup/entity/category.entity';
import { Oup_Group } from '~arm/oup/entity/group.entity';
import { Oup_Location } from '~arm/oup/entity/location.entity'
import { Oup_Position } from '~arm/oup/entity/position.entity';
import { Oup_Stat } from '~arm/oup/entity/stat.entity';
import { Oup_Service } from '~arm/oup/oup.service';
import { Oup_Controller } from '~arm/oup/oup.controller';
import { KPI_DB_CONNECTION } from '~root/src/constants';

@Module({
   providers: [Oup_Service, JwtService],
   controllers: [Oup_Controller],
   imports: [
      TypeOrmModule.forFeature([Oup_Location, Oup_Category, Oup_Group, Oup_Position, Oup_Stat], KPI_DB_CONNECTION)
   ],
   exports: [Oup_Service],
})
export class Oup_Module {}
