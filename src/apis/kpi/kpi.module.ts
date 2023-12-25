import { Module } from "@nestjs/common";
import { KpiService } from "./kpi.service";
import { KpiController } from "./kpi.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { KPIGroup } from './models/kpi-group.model';
import { KPIProduct } from './models/kpi-product.model';
import { KPI } from "./models/kpi.model";

@Module({
   providers: [KpiService],
   controllers: [KpiController],
   imports: [
      SequelizeModule.forFeature([KPI, KPIGroup, KPIProduct])
   ],
   exports: [KpiService],
})
export class KpiModule {}
