import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { ConfigModule } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import { LoggerMiddleware } from "./utils/loggerMiddleware";

import { KpiModule } from './apis/kpi/kpi.module';
import { KPI } from './apis/kpi/models/kpi.model';
import { KPIGroup } from './apis/kpi/models/kpi-group.model';
import { KPIProduct } from './apis/kpi/models/kpi-product.model';

@Module({
   controllers: [],
   providers: [JwtService],
   imports: [
      ConfigModule.forRoot({
         envFilePath: `.env.${process.env.NODE_ENV}`,
      }),
      SequelizeModule.forRoot({
         dialect: "postgres",
         host: process.env.POSTGRES_HOST,
         port: Number(process.env.POSTGRES_PORT),
         username: process.env.POSTGRES_USER,
         password: process.env.POSTGRES_PASSWORD,
         database: process.env.POSTGRES_DB,

         models: [KPI, KPIGroup, KPIProduct],

         autoLoadModels: true,
         synchronize: process.env.NODE_ENV !== 'production'
      }),
      KpiModule,
   ],
})
export class AppModule implements NestModule {
   configure(consumer: MiddlewareConsumer) {
      consumer.apply(LoggerMiddleware).forRoutes('*')
   }
}
