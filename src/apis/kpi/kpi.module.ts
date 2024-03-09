import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';

import { Kpi_Service } from "~kpi/kpi.service";
import { Kpi_Controller } from "~kpi/kpi.controller";
import { KPI_Group } from "~kpi/entity/group.entity";
import { KPI_Product } from "~kpi/entity/product.entity";
import { KPI_Kpi } from '~kpi/entity/kpi.entity';
import { JwtService } from '@nestjs/jwt';
import { KPI_Category } from '~kpi/entity/category.entity';

@Module({
   providers: [Kpi_Service, JwtService],
   controllers: [Kpi_Controller],
   imports: [
      TypeOrmModule.forFeature([KPI_Kpi, KPI_Group, KPI_Category, KPI_Product])
   ],
   exports: [Kpi_Service],
})
export class Kpi_Module {}
