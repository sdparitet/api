import {ApiBody, ApiTags} from "@nestjs/swagger";
import {FORMS_DB_CONNECTION} from "~root/src/constants";
import {Body, Controller, Get, Header, Param, Post, Query, Res} from "@nestjs/common";
import {Form_Service} from "~form/form.service";
import {Roles} from "~guards/roles-auth.decorator";
import {GlobalRoles} from "~roles/All-roles";
import {Form_Roles} from "~roles/form.roles";
import {GetConditionParams, GetFormsParams, RequestGlpiSelectDto} from "~form/dto/get-request-dto";
import {
    CreateFormDto,
    CreateConditionDto,
    AnswerDto
} from "~form/dto/post-request-dto";
import {Response} from "express";
import {RequestUsernameDto} from "~glpi/dto/post-request-dto";

@ApiTags(FORMS_DB_CONNECTION)
@Controller("form")
export class Form_Controller {
    constructor(private formService: Form_Service) {
    }

    /**region [Form] */
    @Roles(Form_Roles.FORM_DATA, ...Object.values(GlobalRoles))
    @Get("/Forms")
    @Header("content-type", "application/json")
    gaf(@Query() params: GetFormsParams, @Res() res: Response) {
        return this.formService.GetForms(params, res)
    }

    @Roles(Form_Roles.FORM_DATA, ...Object.values(GlobalRoles))
    @Get("/Forms/:id")
    @Header("content-type", "application/json")
    gf(@Param('id') id: number, @Query() params: GetFormsParams, @Res() res: Response) {
        return this.formService.GetForms(params, res, id)
    }

    @Roles(Form_Roles.FORM_DATA, ...Object.values(GlobalRoles))
    @Post("/Forms")
    @Header("content-type", "application/json")
    cf(@Body() dto: CreateFormDto[], @Res() res: Response) {
        return this.formService.CreateForm(dto, res)
    }

    //endregion

    /**region [Form block] */

    //endregion

    /**region [Form field] */
    @Roles(Form_Roles.FORM_DATA, ...Object.values(GlobalRoles))
    @Get("/GlpiSelect/:itemtype")
    @Header("content-type", "application/json")
    ggs(@Param('itemtype') itemtype: string, @Query() params: RequestGlpiSelectDto, @Res() res: Response) {
        return this.formService.GetGlpiSelect(itemtype, params, res)
    }

    //endregion

    /**region [Form condition] */
    @Roles(Form_Roles.FORM_DATA, ...Object.values(GlobalRoles))
    @Get("/Condition")
    @Header("content-type", "application/json")
    gc(@Query() params: GetConditionParams, @Res() res: Response) {
        return this.formService.GetConditions(params, res)
    }

    @Roles(Form_Roles.FORM_DATA, ...Object.values(GlobalRoles))
    @Post("/Condition")
    @Header("content-type", "application/json")
    cc(@Body() dto: CreateConditionDto[], @Res() res: Response) {
        return this.formService.CreateConditions(dto, res)
    }

    //endregion

    /**region [Answer] */
    @Roles(Form_Roles.FORM_DATA, ...Object.values(GlobalRoles))
    @Post("/Answer")
    @Header("content-type", "application/json")
    @ApiBody({required: true, type: AnswerDto})
    a(@Body() dto: AnswerDto, @Res() res: Response) {
        return this.formService.Answer(dto, res)
    }

    //endregion
}