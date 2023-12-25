import { Body, Controller, Get, Header, Post, Req, Res } from "@nestjs/common";
import { ApiBadRequestResponse, ApiExcludeController, ApiResponse } from "@nestjs/swagger";
import { Roles } from "../../guard/roles-auth.decorator";
import { KpiService } from "./kpi.service";
import { KpiRoles } from '../../roles/kpi.roles';
import { KPIGetRequestDto } from './dto/get-request-dto';
import { KPIPostRequestDto } from './dto/post-request-dto';

@ApiExcludeController()
@Controller("kpi")
export class KpiController {
   constructor(private kpiService: KpiService) { }

   @Roles(KpiRoles.USER)
   @Get("/GetGroups")
   @Header("content-type", "application/json")
   ggs() {
      return this.kpiService.getGroups();
   }

   @Roles(KpiRoles.USER)
   @Get("/GetGroup")
   @Header("content-type", "application/json")
   gg(@Body() dto: KPIGetRequestDto) {
      return this.kpiService.getGroup(dto);
   }

   @Roles(KpiRoles.USER)
   @Get("/GetKPI")
   @Header("content-type", "application/json")
   gkpi(@Body() dto: KPIGetRequestDto) {
      return this.kpiService.getKPI(dto);
   }

   @Roles(KpiRoles.USER)
   @Post("/SetKPI")
   @Header("content-type", "application/json")
   skpi(@Body() dto: Array<KPIPostRequestDto>) {
      return this.kpiService.setKPI(dto);
   }
}
