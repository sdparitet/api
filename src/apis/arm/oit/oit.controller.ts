import { Body, Controller, Get, Header, Post, Req } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { Oit_Roles } from '~roles/oit.roles'
import { Oit_Service } from '~oit/oit.service'
import { Roles } from '~guards/roles-auth.decorator'
import { OIT_GetAccidentsDto } from '~oit/dto/get-dto'
import { Oit_AddAccidentDto, Oit_RemoveAccidentDto } from '~oit/dto/post-dto'


@ApiTags('ARM OIT')
@Controller('oit')
export class Oit_Controller {
   constructor(private armService: Oit_Service) {
   }

   @Roles(Oit_Roles.OIT_USER)
   @Get('/getGroups')
   @Header('content-type', 'application/json')
   getDepartments(@Req() req: Request) {
      return this.armService.getGroups(req)
   }

   @Roles(Oit_Roles.OIT_USER)
   @Post('/getAccidents')
   @Header('content-type', 'application/json')
   getCategories(@Req() req: Request, @Body() dto: OIT_GetAccidentsDto) {
      return this.armService.getAccidents(dto, req)
   }

   @Roles(Oit_Roles.OIT_USER)
   @Post('/addAccident')
   @Header('content-type', 'application/json')
   getGroups(@Req() req: Request, @Body() dto: Oit_AddAccidentDto) {
      return this.armService.addAccident(dto, req)
   }

   @Roles(Oit_Roles.OIT_USER)
   @Post('/removeAccident')
   @Header('content-type', 'application/json')
   getStaff(@Body() dto: Oit_RemoveAccidentDto) {
      return this.armService.removeAccident(dto)
   }
}
