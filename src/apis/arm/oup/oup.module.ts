import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtService } from '@nestjs/jwt'
import { Module } from '@nestjs/common'
import { Oup_Service } from '~oup/oup.service'
import { KPI_DB_CONNECTION } from '~src/constants'
import { Oup_Stat } from '~oup/entity/stat.entity'
import { Oup_Group } from '~oup/entity/group.entity'
import { Oup_Controller } from '~oup/oup.controller'
import { Oup_Position } from '~oup/entity/position.entity'
import { Oup_Category } from '~oup/entity/category.entity'


@Module({
   providers: [Oup_Service, JwtService],
   controllers: [Oup_Controller],
   imports: [
      TypeOrmModule.forFeature([Oup_Category, Oup_Group, Oup_Position, Oup_Stat], KPI_DB_CONNECTION),
   ],
   exports: [Oup_Service],
})
export class Oup_Module {
}
