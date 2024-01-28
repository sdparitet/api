import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Kpi_Module } from '~kpi/kpi.module';
import { LoggerMiddleware } from '~utils/loggerMiddleware';

@Module({
   controllers: [],
   providers: [JwtService],
   imports: [
      ConfigModule.forRoot({
         envFilePath: `.env.${process.env.NODE_ENV}`,
      }),
      TypeOrmModule.forRoot({
         type: 'postgres',
         host: process.env.POSTGRES_HOST,
         port: Number(process.env.POSTGRES_PORT),
         username: process.env.POSTGRES_USER,
         password: process.env.POSTGRES_PASSWORD,
         database: process.env.POSTGRES_DB,
         // entity: [
         //    KPI_Kpi, KPI_Group, KPI_Product, KPI_KpiProduct,
         // ],
         autoLoadEntities: true,
         logging: process.env.NODE_ENV !== 'production' ? "all" : ["error"],
         synchronize: process.env.NODE_ENV !== 'production',
      }),
      // SequelizeModule.forRoot({
      //    dialect: "postgres",
      //    host: process.env.POSTGRES_HOST,
      //    port: Number(process.env.POSTGRES_PORT),
      //    username: process.env.POSTGRES_USER,
      //    password: process.env.POSTGRES_PASSWORD,
      //    database: process.env.POSTGRES_DB,
      //
      //    models: [KPI_Kpi, KPI_Group, KPI_Product, KPI_KpiProduct],
      //
      //    autoLoadModels: true,
      //    synchronize: process.env.NODE_ENV !== 'production'
      // }),
      Kpi_Module,
   ],
})
export class AppModule implements NestModule {
   configure(consumer: MiddlewareConsumer) {
      consumer.apply(LoggerMiddleware).forRoutes('*')
   }
}
