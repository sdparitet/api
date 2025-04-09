import { Body, Controller, Get, Header, Post, Req } from "@nestjs/common";
import { Roles } from '~guards/roles-auth.decorator';
import { GlobalRoles } from '~roles/All-roles';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger'
import { Oit_Service } from '~arm/oit/oit.service'
import { OIT_GetAccidentsDto } from '~arm/oit/dto/get-dto'
import { Oit_AddAccidentDto, Oit_RemoveAccidentDto } from '~arm/oit/dto/post-dto'
import { Oit_Roles } from '~roles/oit.roles'


@ApiTags('ARM OIT')
@Controller("oit")
export class Oit_Controller {
   constructor(private armService: Oit_Service) { }

   @Roles(Oit_Roles.OIT_USER, ...Object.values(GlobalRoles))
   @Get("/getGroups")
   @Header("content-type", "application/json")
   getDepartments(@Req() req: Request) {
      return this.armService.getGroups(req);
   }

   @Roles(Oit_Roles.OIT_USER, ...Object.values(GlobalRoles))
   @Post("/getAccidents")
   @Header("content-type", "application/json")
   getCategories(@Req() req: Request, @Body() dto: OIT_GetAccidentsDto) {
      return this.armService.getAccidents(dto, req);
   }

   @Roles(Oit_Roles.OIT_USER, ...Object.values(GlobalRoles))
   @Post("/addAccident")
   @Header("content-type", "application/json")
   getGroups(@Req() req: Request, @Body() dto: Oit_AddAccidentDto) {
      return this.armService.addAccident(dto, req);
   }

   @Roles(Oit_Roles.OIT_USER, ...Object.values(GlobalRoles))
   @Post("/removeAccident")
   @Header("content-type", "application/json")
   getStaff(@Body() dto: Oit_RemoveAccidentDto) {
      return this.armService.removeAccident(dto);
   }
}
