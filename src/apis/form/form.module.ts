import {Module} from "@nestjs/common";

import {Form_Service} from "~form/form.service";
import {Form_Controller} from "~form//form.controller";
import {CacheModule} from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";
import {TypeOrmModule} from "@nestjs/typeorm";
import {FORMS_DB_CONNECTION} from "~root/src/constants";
import {Form} from "~form/entity/form.entity";
import {Block} from "~form/entity/block.entity";
import {Field} from "~form/entity/field.entity";
import {Condition} from "~form/entity/condition.entity";
import {Template} from "~form/entity/template.entity";
import {TemplateCondition} from "~form/entity/template.conditions.entity";


@Module({
    providers: [Form_Service],
    controllers: [Form_Controller],
    imports: [
        TypeOrmModule.forFeature([Form, Block, Field, Condition, Template, TemplateCondition], FORMS_DB_CONNECTION),
        CacheModule.register({
            store: redisStore,
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            db: 1,
        }),
    ],
    exports: [Form_Service],
})
export class Form_Module {
}