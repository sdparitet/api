import { Module } from "@nestjs/common";

import { GLPI_Service } from "./glpi.service";
import { GLPI_Controller } from "./glpi.controller";
import {CacheModule} from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";

@Module({
   providers: [GLPI_Service],
   controllers: [GLPI_Controller],
   imports: [
      CacheModule.register({
         store: redisStore,
         host: process.env.REDIS_HOST,
         port: process.env.REDIS_PORT,
      }),
   ],
   exports: [GLPI_Service],
})
export class GLPI_Module {}
