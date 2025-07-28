import { Body, Controller, Get, Header, Post, Req } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { Oup_Roles } from '~roles/oup.roles'
import { Oup_Service } from '~oup/oup.service'
import { Roles } from '~guards/roles-auth.decorator'
import { OUP_GetRequestDto } from '~oup/dto/get-request-dto'
import { OUP_PostRequestDto, OUP_EditPosDto } from '~oup/dto/post-request-dto'


@ApiTags('ARM OUP')
@Controller('oup')
export class Oup_Controller {
   constructor(private staffService: Oup_Service) {
   }

   @Roles(Oup_Roles.OUP_USER)
   @Get('/GetCategories')
   @Header('content-type', 'application/json')
   gcs(@Req() req: Request) {
      return this.staffService.getCategories(req)
   }

   @Roles(Oup_Roles.OUP_USER)
   @Get('/GetGroups')
   @Header('content-type', 'application/json')
   ggs(@Req() req: Request) {
      return this.staffService.getGroups(req)
   }

   @Roles(Oup_Roles.OUP_USER)
   @Post('/GetStaff')
   @Header('content-type', 'application/json')
   gkpi(@Req() req: Request, @Body() dto: OUP_GetRequestDto) {
      return this.staffService.GetStaff(dto, req)
   }

   @Roles(Oup_Roles.OUP_USER)
   @Post('/SetStaff')
   @Header('content-type', 'application/json')
   skpi(@Req() req: Request, @Body() dto: Array<OUP_PostRequestDto>) {
      return this.staffService.SetStaff(dto)
   }

   @Roles(Oup_Roles.OUP_USER)
   @Post('/EditPosition')
   @Header('content-type', 'application/json')
   editpos(@Body() dto: Partial<OUP_EditPosDto>) {
      return this.staffService.EditPosition(dto)
   }

   @Roles(Oup_Roles.OUP_USER)
   @Post('/RemovePosition')
   @Header('content-type', 'application/json')
   repos(@Body() dto: Partial<OUP_EditPosDto>) {
      return this.staffService.RemovePosition(dto)
   }
}
