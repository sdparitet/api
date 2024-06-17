import { Module } from "@nestjs/common";

import { GLPI_Service } from "./glpi.service";
import { GLPI_Controller } from "./glpi.controller";

@Module({
   providers: [GLPI_Service],
   controllers: [GLPI_Controller],
   imports: [],
   exports: [GLPI_Service],
})
export class GLPI_Module {}
