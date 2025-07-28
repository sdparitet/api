import { Body, Controller, Get, Header, Param, Post, Res, UseInterceptors, UploadedFiles } from '@nestjs/common'
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AnyFilesInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import { Form_Roles } from '~roles/form.roles'
import { Form_Service } from '~forms/form.service'
import { Portal_Roles } from '~roles/portal.roles'
import { Username } from '~decorators/jwt.username'
import { Roles } from '~guards/roles-auth.decorator'
import { FORMS_DB_CONNECTION } from '~src/constants'
import { AnswerDto, AnswerFilesDto } from '~forms/dto/post-request-dto'
import { UploadTicketDocumentResponse } from '~tickets/dto/post-request-dto'


@ApiTags(FORMS_DB_CONNECTION)
@Controller('form')
export class Form_Controller {
   constructor(private formService: Form_Service) {
   }

   //region [ Form ]
   @Roles([Portal_Roles.PORTAL_USERS, Form_Roles.FORM_DATA])
   @Get('/Forms')
   @Header('content-type', 'application/json')
   gf(@Username() username: string, @Res() res: Response) {
      return this.formService.GetForms(username, res)
   }

   @Roles([Portal_Roles.PORTAL_USERS, Form_Roles.FORM_DATA])
   @Get('/Forms/:id')
   @Header('content-type', 'application/json')
   gfi(@Username() username: string, @Param('id') id: number, @Res() res: Response) {
      return this.formService.GetForms(username, res, id)
   }

   //endregion

   //region [ Answer ]
   @Roles([Portal_Roles.PORTAL_USERS, Form_Roles.FORM_DATA])
   @Post('/Answer')
   @Header('content-type', 'application/json')
   @ApiBody({ required: true, type: AnswerDto })
   a(@Username() username: string, @Body() dto: AnswerDto, @Res() res: Response) {
      return this.formService.Answer(username, dto, res)
   }

   @Roles([Portal_Roles.PORTAL_USERS, Form_Roles.FORM_DATA])
   @Post('/AnswerFiles')
   @ApiConsumes('multipart/forms-data')
   @ApiResponse({ type: UploadTicketDocumentResponse })
   @ApiBody({ required: true, type: AnswerFilesDto })
   @UseInterceptors(AnyFilesInterceptor({ limits: { fileSize: 1024 * 1024 * 80 } }))
   af(@Username() username: string,
      @UploadedFiles() files: Express.Multer.File[],
      @Body() dto: AnswerFilesDto,
      @Res() res: Response) {
      return this.formService.AnswerFiles(username, dto, files, res)
   }

   //endregion
}
