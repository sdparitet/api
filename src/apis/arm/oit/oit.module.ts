import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtService } from '@nestjs/jwt';
import { Oit_Accident } from '~arm/oit/entity/accident.entity'
import { Oit_Group } from '~arm/oit/entity/group.entity'
import { Oit_Service } from '~arm/oit/oit.service'
import { Oit_Controller } from '~arm/oit/oit.controller'
import { KPI_DB_CONNECTION } from '~root/src/constants'

@Module({
   providers: [Oit_Service, JwtService],
   controllers: [Oit_Controller],
   imports: [
      TypeOrmModule.forFeature([Oit_Group, Oit_Accident], KPI_DB_CONNECTION)
   ],
   exports: [Oit_Service],
})
export class Arm_Module {}
