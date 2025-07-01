import { ApiBody, ApiTags } from '@nestjs/swagger'
import { FORMS_DB_CONNECTION } from '~root/src/constants'
import { Body, Controller, Get, Header, Param, Post, Res, Headers } from '@nestjs/common'
import { Form_Service } from '~form/form.service'
import { Roles } from '~guards/roles-auth.decorator'
import { Form_Roles } from '~roles/form.roles'
import { AnswerDto } from '~form/dto/post-request-dto'
import { Response } from 'express'
import { JwtService } from '@nestjs/jwt'
import { Username } from '~root/src/decorators/jwt.username'


@ApiTags(FORMS_DB_CONNECTION)
@Controller('form')
export class Form_Controller {
   constructor(private formService: Form_Service) {
   }

   //region [ Form ]
   @Roles(Form_Roles.FORM_DATA)
   @Get('/Forms')
   @Header('content-type', 'application/json')
   gaf(@Username() username: string, @Res() res: Response) {
      return this.formService.GetForms(username, res)
   }

   @Roles(Form_Roles.FORM_DATA)
   @Get('/Forms/:id')
   @Header('content-type', 'application/json')
   gf(@Username() username: string, @Param('id') id: number, @Res() res: Response) {
      return this.formService.GetForms(username, res, id)
   }

   //endregion


   //region [ Answer ]
   @Roles(Form_Roles.FORM_DATA)
   @Post('/Answer')
   @Header('content-type', 'application/json')
   @ApiBody({ required: true, type: AnswerDto })
   a(@Username() username: string, @Body() dto: AnswerDto, @Res() res: Response) {
      return this.formService.Answer(username, dto, res)
   }

   //endregion
}
