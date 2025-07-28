import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtService } from '@nestjs/jwt'
import { Module } from '@nestjs/common'
import { Oit_Service } from '~oit/oit.service'
import { KPI_DB_CONNECTION } from '~src/constants'
import { Oit_Controller } from '~oit/oit.controller'
import { Oit_Group } from '~oit/entity/group.entity'
import { Oit_Accident } from '~oit/entity/accident.entity'


@Module({
   providers: [Oit_Service, JwtService],
   controllers: [Oit_Controller],
   imports: [
      TypeOrmModule.forFeature([Oit_Group, Oit_Accident], KPI_DB_CONNECTION),
   ],
   exports: [Oit_Service],
})
export class Arm_Module {
}
