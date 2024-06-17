import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

import { KPI_DB_CONNECTION } from '~root/src/constants';
import { Kpi_Service } from "~kpi/kpi.service";
import { KPI_Group } from "~kpi/entity/group.entity";
import { KPI_Product } from "~kpi/entity/product.entity";
import { KPI_Kpi } from '~kpi/entity/kpi.entity';
import { KPI_Category } from '~kpi/entity/category.entity';
import { Kpi_Controller } from '~kpi/kpi.controller';

@Module({
   providers: [Kpi_Service, JwtService],
   controllers: [Kpi_Controller],
   imports: [
      TypeOrmModule.forFeature([KPI_Kpi, KPI_Group, KPI_Category, KPI_Product], KPI_DB_CONNECTION)
   ],
   exports: [Kpi_Service],
})
export class Kpi_Module {}
