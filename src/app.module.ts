import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { STAT_DB_CONNECTION, KPI_DB_CONNECTION } from '~root/src/constants';

import { Kpi_Module } from '~kpi/kpi.module';
import { LoggerMiddleware } from '~utils/loggerMiddleware';
import { Stat_Module } from '~stat/stat.module';

@Module({
   controllers: [],
   providers: [JwtService],
   imports: [
      ConfigModule.forRoot({
         envFilePath: `.env.${process.env.NODE_ENV}`,
      }),
      ScheduleModule.forRoot(),

      TypeOrmModule.forRoot({
         // name: KPI_DB_CONNECTION,
         type: 'postgres',
         host: process.env.POSTGRES_HOST,
         port: Number(process.env.POSTGRES_PORT),
         username: process.env.POSTGRES_USER,
         password: process.env.POSTGRES_PASSWORD,
         database: process.env.POSTGRES_DB,
         entities: [__dirname + "/apis/kpi/entity/*.entity.{js,ts}"],
         autoLoadEntities: true,
         logging: process.env.NODE_ENV === 'development' ? "all" : ["error"],
         synchronize: process.env.NODE_ENV === 'development',
      }),
      TypeOrmModule.forRoot({
         name: STAT_DB_CONNECTION,
         type: 'mariadb',
         host: process.env.GLPI_HOST,
         port: Number(process.env.GLPI_PORT),
         username: process.env.GLPI_USER,
         password: process.env.GLPI_PASSWORD,
         database: process.env.GLPI_DB,
         entities: [__dirname + "/apis/stat/entity/*.entity.{js,ts}"],
         autoLoadEntities: true,
         logging: process.env.NODE_ENV === 'development' ? "all" : ["error"],
         synchronize: process.env.NODE_ENV === 'development',
      }),

      Kpi_Module,
      Stat_Module,
   ],
})
export class AppModule implements NestModule {
   configure(consumer: MiddlewareConsumer) {
      consumer.apply(LoggerMiddleware).forRoutes('*')
   }
}
