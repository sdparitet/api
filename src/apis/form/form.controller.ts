import {ApiBody, ApiTags} from "@nestjs/swagger";
import {FORMS_DB_CONNECTION} from "~root/src/constants";
import {Body, Controller, Get, Header, Param, Post, Query, Res, Headers} from "@nestjs/common";
import {Form_Service} from "~form/form.service";
import {Roles} from "~guards/roles-auth.decorator";
import {GlobalRoles} from "~roles/All-roles";
import {Form_Roles} from "~roles/form.roles";
import {GetFormsParams, RequestGlpiSelectDto} from "~form/dto/get-request-dto";
import {
    AnswerDto
} from "~form/dto/post-request-dto";
import {Response} from "express";
import {Portal_Roles} from "~roles/portal.roles";
import { JwtService } from '@nestjs/jwt'

@ApiTags(FORMS_DB_CONNECTION)
@Controller("form")
export class Form_Controller {
    constructor(private jwtService: JwtService, private formService: Form_Service) {
    }

    //region [ Form ]
    @Roles(Form_Roles.FORM_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Get("/Forms")
    @Header("content-type", "application/json")
    gaf(@Headers() headers: any, @Query() params: GetFormsParams, @Res() res: Response) {
        const jwt = this.jwtService.decode(headers.authorization.split(' ')[1])
        return this.formService.GetForms(jwt.userName, params, res)
    }

    @Roles(Form_Roles.FORM_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Get("/Forms/:id")
    @Header("content-type", "application/json")
    gf(@Headers() headers: any, @Param('id') id: number, @Query() params: GetFormsParams, @Res() res: Response) {
        const jwt = this.jwtService.decode(headers.authorization.split(' ')[1])
        return this.formService.GetForms(jwt.userName, params, res, id)
    }

    //endregion

    //region [ Form field ]
    @Roles(Form_Roles.FORM_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Get("/GlpiSelect")
    @Header("content-type", "application/json")
    ggs(@Query() params: RequestGlpiSelectDto, @Res() res: Response) {
        return this.formService.GetGlpiSelect(params, res)
    }
    //endregion

    //region [ Form template ]
    @Roles(Form_Roles.FORM_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Get("/FormTemplate/:id")
    @Header("content-type", "application/json")
    gft(@Param('id') id: number, @Res() res: Response) {
        return this.formService.GetFormTemplates(id, res)
    }
    //endregion

    //region [ Answer ]
    @Roles(Form_Roles.FORM_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/Answer")
    @Header("content-type", "application/json")
    @ApiBody({required: true, type: AnswerDto})
    a(@Body() dto: AnswerDto, @Res() res: Response) {
        return this.formService.Answer(dto, res)
    }

    //endregion
}
