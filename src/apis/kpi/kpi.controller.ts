import { Body, Controller, Get, Header, Post, Req } from "@nestjs/common";
import { Kpi_Service } from "~kpi/kpi.service";
import { Roles } from '~guards/roles-auth.decorator';
import { Kpi_Roles } from '~roles/kpi.roles';
import { GlobalRoles } from '~roles/All-roles';
import { KPI_GetRequestDto } from '~kpi/dto/get-request-dto';
import { KPI_PostRequestDto } from '~kpi/dto/post-request-dto';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('kpi')
@Controller("kpi")
export class Kpi_Controller {
   constructor(private kpiService: Kpi_Service) { }

   @Roles(Kpi_Roles.KPI_USER, ...Object.values(GlobalRoles))
   @Get("/GetCategories")
   @Header("content-type", "application/json")
   gcs(@Req() req: Request) {
      return this.kpiService.getCategories(req);
   }

   @Roles(Kpi_Roles.KPI_USER, ...Object.values(GlobalRoles))
   @Get("/GetGroups")
   @Header("content-type", "application/json")
   ggs(@Req() req: Request) {
      return this.kpiService.getGroups(req);
   }

   @Roles(Kpi_Roles.KPI_USER, ...Object.values(GlobalRoles))
   @Post("/GetKPI")
   @Header("content-type", "application/json")
   gkpi(@Req() req: Request, @Body() dto: KPI_GetRequestDto) {
      return this.kpiService.getKPI(dto, req);
   }

   @Roles(Kpi_Roles.KPI_USER, ...Object.values(GlobalRoles))
   @Post("/SetKPI")
   @Header("content-type", "application/json")
   skpi(@Req() req: Request, @Body() dto: Array<KPI_PostRequestDto>) {
      return this.kpiService.setKPI(dto, req);
   }
}

