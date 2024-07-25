import {MiddlewareConsumer, Module, NestModule} from "@nestjs/common";
import {JwtService} from '@nestjs/jwt';
import {ConfigModule} from '@nestjs/config';
import {TypeOrmModule} from '@nestjs/typeorm';

import {GLPI_DB_CONNECTION, FORMS_DB_CONNECTION, KPI_DB_CONNECTION, STAT_DB_CONNECTION} from '~root/src/constants';

import {Kpi_Module} from '~kpi/kpi.module';
import {LoggerMiddleware} from '~utils/loggerMiddleware';
import {Stat_Module} from '~stat/stat.module';
import {Staff_Module} from '~staff/staff.module';
import {GLPI_Module} from '~glpi/glpi.module';
import {Form_Module} from "~root/src/apis/form/form.module";

@Module({
    controllers: [],
    providers: [JwtService],
    imports: [
        ConfigModule.forRoot({
            envFilePath: `.env.${process.env.NODE_ENV}`,
        }),

        TypeOrmModule.forRoot({
            name: FORMS_DB_CONNECTION,
            type: 'postgres',
            host: process.env.FORMS_HOST,
            port: Number(process.env.FORMS_PORT),
            username: process.env.FORMS_USER,
            password: process.env.FORMS_PASSWORD,
            database: process.env.FORMS_DB,
            entities: [
                __dirname + '/apis/form/entity/*.entity.{js,ts}',
            ],
            autoLoadEntities: true,
            logging: process.env.NODE_ENV === 'development' ? "all" : ["error"],
            synchronize: process.env.NODE_ENV === 'development',
        }),

        TypeOrmModule.forRoot({
            name: KPI_DB_CONNECTION,
            type: 'postgres',
            host: process.env.POSTGRES_HOST,
            port: Number(process.env.POSTGRES_PORT),
            username: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            database: process.env.POSTGRES_DB,
            entities: [
                __dirname + "/apis/kpi/entity/*.entity.{js,ts}",
                __dirname + "/apis/staff/entity/*.entity.{js,ts}",
            ],
            autoLoadEntities: true,
            logging: process.env.NODE_ENV === 'development' ? "all" : ["error"],
            synchronize: process.env.NODE_ENV === 'development',
        }),

        TypeOrmModule.forRoot({
            name: STAT_DB_CONNECTION,
            type: 'mariadb',
            host: process.env.STAT_HOST,
            port: Number(process.env.STAT_PORT),
            username: process.env.STAT_USER,
            password: process.env.STAT_PASSWORD,
            database: process.env.STAT_DB,
            entities: [
                __dirname + "/apis/stat/entity/*.entity.{js,ts}",
            ],
            autoLoadEntities: true,
            logging: process.env.NODE_ENV === 'development' ? "all" : ["error"],
            synchronize: process.env.NODE_ENV === 'development',
        }),

        TypeOrmModule.forRoot({
            name: GLPI_DB_CONNECTION,
            type: 'mariadb',
            host: process.env.GLPI_HOST,
            port: Number(process.env.GLPI_PORT),
            username: process.env.GLPI_USER,
            password: process.env.GLPI_PASSWORD,
            database: process.env.GLPI_DB,
            entities: [],
            autoLoadEntities: false,
            logging: process.env.NODE_ENV === 'development' ? "all" : ["error"],
            synchronize: process.env.NODE_ENV === 'development',
        }),

        Kpi_Module,
        Staff_Module,
        Stat_Module,
        GLPI_Module,
        Form_Module,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes('*')
    }
}
