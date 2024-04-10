import { Body, Controller, Get, Header, Post, Req } from "@nestjs/common";
import { Roles } from '~guards/roles-auth.decorator';
import { GlobalRoles } from '~roles/All-roles';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Staff_Roles } from '~roles/staff.roles';
import { Staff_Service } from '~staff/staff.service';
import { STAFF_GetRequestDto } from '~staff/dto/get-request-dto';
import { STAFF_PostRequestDto } from '~staff/dto/post-request-dto';

@ApiTags('staff')
@Controller("staff")
export class Staff_Controller {
   constructor(private staffService: Staff_Service) { }

   @Roles(Staff_Roles.STAFF_USER, ...Object.values(GlobalRoles))
   @Get("/GetCategories")
   @Header("content-type", "application/json")
   gcs(@Req() req: Request) {
      return this.staffService.getCategories(req);
   }

   @Roles(Staff_Roles.STAFF_USER, ...Object.values(GlobalRoles))
   @Get("/GetGroups")
   @Header("content-type", "application/json")
   ggs(@Req() req: Request) {
      return this.staffService.getGroups(req);
   }

   @Roles(Staff_Roles.STAFF_USER, ...Object.values(GlobalRoles))
   @Post("/GetStaff")
   @Header("content-type", "application/json")
   gkpi(@Req() req: Request, @Body() dto: STAFF_GetRequestDto) {
      return this.staffService.GetStaff(dto, req);
   }

   @Roles(Staff_Roles.STAFF_USER, ...Object.values(GlobalRoles))
   @Post("/SetStaff")
   @Header("content-type", "application/json")
   skpi(@Req() req: Request, @Body() dto: Array<STAFF_PostRequestDto>) {
      return this.staffService.SetStaff(dto);
   }
}
