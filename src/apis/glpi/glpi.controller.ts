import {
    Body,
    Controller,
    Get,
    Header,
    Post,
    Query,
    Res,
    UploadedFiles,
    UseInterceptors
} from "@nestjs/common"
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger'
import { Roles } from '~guards/roles-auth.decorator'
import { GlobalRoles } from '~roles/All-roles'
import { GLPI_Roles } from '~roles/glpi.roles'
import { GLPI_Service } from '~glpi/glpi.service'
import {
    TicketInfoResponse,
    TicketMembersResponse,
    TicketChatResponse,
    RequestUsernameDto,
    RequestTicketIdDto,
    UserTicketsResponse,
    TicketsMembersResponse,
    RequestTicketIdAndUsernameDto,
    TicketFollowupDto,
    UserAccessOnTicket,
    CreateTicketFollowupResponse,
    ResponseGetImagePreviewResponse,
    GlpiUsersInGroupsResponse,
    UploadTicketDocumentResponse,
    RequestTicketIdAndUsernameAndStateDto,
    DeleteUserFromTicketRequest,
    GetSolutionRequest,
    GetSolutionResponse,
    GetTaskResponse,
    SetTaskStateRequest,
    CreateSolutionRequest,
    SolutionAnswerRequest,
    DefaultResponse,
    ChangeTicketStatusRequest,
    CreateTaskRequest,
    GetTicketsMembersRequest,
    SetAgreementStatusRequest, GetAgreementInfoResponse, CreateAgreementRequest,
} from '~glpi/dto/post-request-dto'
import { Response } from "express"

import { GLPI_DB_CONNECTION } from '~root/src/constants'
import { GetAgreementUserParams, GetImagePreviewParams, GetUserAccessResponse } from "~glpi/dto/get-request-dto"
import { FilesInterceptor } from "@nestjs/platform-express"
import { Portal_Roles } from "~roles/portal.roles"

@ApiTags(GLPI_DB_CONNECTION)
@Controller("glpi")
export class GLPI_Controller {
    constructor(
        private glpiService: GLPI_Service,
    ) {
    }

    //region [ Ticket list ]
    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/GetUserTickets")
    @Header("content-type", "application/json")
    @ApiBody({ required: false, type: RequestUsernameDto })
    @ApiResponse({ type: [UserTicketsResponse] })
    gut(@Body() dto: RequestUsernameDto, @Res() res: Response) {
        return this.glpiService.GetUserTickets(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/GetUserAssignTickets")
    @Header("content-type", "application/json")
    @ApiBody({ required: false, type: RequestUsernameDto })
    @ApiResponse({ type: [UserTicketsResponse] })
    guat(@Body() dto: RequestUsernameDto, @Res() res: Response) {
        return this.glpiService.GetUserAssignTickets(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/GetTicketsMembers")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: RequestUsernameDto })
    @ApiResponse({ type: [GetTicketsMembersRequest] })
    gtm(@Body() dto: GetTicketsMembersRequest, @Res() res: Response) {
        return this.glpiService.GetTicketsMembers(dto, res)
    }

    // endregion

    //region [ Ticket info ]
    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/GetUserAccessOnTicket")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: RequestTicketIdAndUsernameDto })
    @ApiResponse({ type: [UserAccessOnTicket] })
    guaot(@Body() dto: RequestTicketIdAndUsernameDto, @Res() res: Response) {
        return this.glpiService.GetUserAccessOnTicket(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Get("/GetUserAccess")
    @Header("content-type", "application/json")
    @ApiResponse({ type: [GetUserAccessResponse] })
    gua(@Query() params: { username: string }, @Res() res: Response) {
        return this.glpiService.GetUserAccess(params, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/GetTicketInfo")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: RequestTicketIdAndUsernameDto })
    @ApiResponse({ type: [TicketInfoResponse] })
    gtibi(@Body() dto: RequestTicketIdAndUsernameDto, @Res() res: Response) {
        return this.glpiService.GetTicketInfo(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/GetTicketMembers")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: RequestTicketIdDto })
    @ApiResponse({ type: [TicketMembersResponse] })
    gtubti(@Body() dto: RequestTicketIdDto, @Res() res: Response) {
        return this.glpiService.GetTicketMembers(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/GetTicketChat")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: RequestTicketIdAndUsernameDto })
    @ApiResponse({ type: [TicketChatResponse] })
    gtfbti(@Body() dto: RequestTicketIdAndUsernameDto, @Res() res: Response) {
        return this.glpiService.GetTicketChat(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/GetSolutionInfo")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: GetSolutionRequest })
    @ApiResponse({ type: [GetSolutionResponse] })
    gss(@Body() dto: GetSolutionRequest, @Res() res: Response) {
        return this.glpiService.GetSolutionInfo(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Get('/GetSolutionTemplates')
    @Header("content-type", "application/json")
    @ApiResponse({ type: [DefaultResponse] })
    gst(@Res() res: Response) {
        return this.glpiService.GetSolutionTemplates(res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Get('/GetUsers')
    @Header("content-type", "application/json")
    gu(@Res() res: Response) {
        return this.glpiService.GetUsers(res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Get('/GetGroups')
    @Header("content-type", "application/json")
    gg(@Res() res: Response) {
        return this.glpiService.GetGroups(res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/CreateSolution")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: CreateSolutionRequest })
    @ApiResponse({ type: [DefaultResponse] })
    cs(@Body() dto: CreateSolutionRequest, @Res() res: Response) {
        return this.glpiService.CreateSolution(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/SetSolutionAnswer")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: SolutionAnswerRequest })
    @ApiResponse({ type: [DefaultResponse] })
    ssa(@Body() dto: SolutionAnswerRequest, @Res() res: Response) {
        return this.glpiService.SetSolutionAnswer(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/GetTaskInfo")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: RequestTicketIdDto })
    @ApiResponse({ type: [GetTaskResponse] })
    gti(@Body() dto: RequestTicketIdDto, @Res() res: Response) {
        return this.glpiService.GetTaskInfo(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/SetTaskState")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: SetTaskStateRequest })
    sts(@Body() dto: SetTaskStateRequest, @Res() res: Response) {
        return this.glpiService.SetTaskState(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/CreateTask")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: CreateTaskRequest })
    ct(@Body() dto: CreateTaskRequest, @Res() res: Response) {
        return this.glpiService.CreateTask(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/GetAgreementInfo")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: RequestTicketIdDto })
    @ApiResponse({ type: [GetAgreementInfoResponse] })
    gai(@Body() dto: RequestTicketIdDto, @Res() res: Response) {
        return this.glpiService.GetAgreementInfo(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Get("/GetAgreementUser")
    @Header("content-type", "application/json")
    gau(@Query() params: GetAgreementUserParams, @Res() res: Response) {
        return this.glpiService.GetAgreementUser(params, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/SetAgreementStatus")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: SetAgreementStatusRequest })
    sas(@Body() dto: SetAgreementStatusRequest, @Res() res: Response) {
        return this.glpiService.SetAgreementStatus(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/CreateAgreement")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: CreateAgreementRequest })
    ca(@Body() dto: CreateAgreementRequest, @Res() res: Response) {
        return this.glpiService.CreateAgreement(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/ChangeTicketStatus")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: ChangeTicketStatusRequest })
    cts(@Body() dto: ChangeTicketStatusRequest, @Res() res: Response) {
        return this.glpiService.ChangeTicketStatus(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/DeleteUserFromTicket")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: DeleteUserFromTicketRequest })
    duft(@Body() dto: DeleteUserFromTicketRequest, @Res() res: Response) {
        return this.glpiService.DeleteUserFromTicket(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Get("/GetUserIdByUsername")
    @Header("content-type", "application/json")
    guibu(@Query() params: RequestUsernameDto, @Res() res: Response) {
        return this.glpiService.GetUserInfoByUsername(params, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/AddUsersInTicket")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: Array<DeleteUserFromTicketRequest> })
    auft(@Body() dto: DeleteUserFromTicketRequest[], @Res() res: Response) {
        return this.glpiService.AddUsersInTicket(dto, res)
    }

    // endregion

    //region [ Phonebook ]
    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Get("/GetGlpiUsersInGroups")
    @Header("content-type", "application/json")
    @ApiResponse({ type: [GlpiUsersInGroupsResponse] })
    gguig(@Res() res: Response) {
        return this.glpiService.GetGlpiUsersInGroups(res)
    }

    // endregion

    //region [ GLPI API ]
    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/CreateTicketFollowup")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: TicketFollowupDto })
    @ApiResponse({ type: [CreateTicketFollowupResponse] })
    ctf(@Body() dto: TicketFollowupDto, @Res() res: Response) {
        return this.glpiService.CreateTicketFollowup(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/SwitchTicketNotifications")
    @Header("content-type", "application/json")
    @ApiBody({ required: true, type: RequestTicketIdAndUsernameAndStateDto })
    // @ApiResponse({type: [TicketFollowupsResponse]})
    stf(@Body() dto: RequestTicketIdAndUsernameAndStateDto, @Res() res: Response) {
        return this.glpiService.SwitchTicketNotifications(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/UploadTicketDocument")
    @ApiBody({ required: true, type: RequestTicketIdAndUsernameDto })
    @ApiResponse({ type: [UploadTicketDocumentResponse] })
    @UseInterceptors(FilesInterceptor('files', 100, { limits: { fileSize: 1024 * 1024 * 80 } }))
    ud(@UploadedFiles() files: Express.Multer.File[], @Body() dto: RequestTicketIdAndUsernameDto, @Res() res: Response) {
        return this.glpiService.UploadTicketDocument(files, dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Post("/DownloadDocument")
    @Header("content-type", "application/octet-stream")
    @ApiBody({ required: true, type: RequestTicketIdAndUsernameDto })
    dd(@Body() dto: RequestTicketIdAndUsernameDto, @Res() res: Response) {
        return this.glpiService.DownloadDocument(dto, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Get("/GetImagePreview")
    @Header("content-type", "application/json; charset=utf-8")
    @ApiResponse({ type: [ResponseGetImagePreviewResponse] })
    gip(@Query() params: GetImagePreviewParams, @Res() res: Response) {
        return this.glpiService.GetImagePreview(params, res)
    }

    @Roles(GLPI_Roles.GLPI_DATA, Portal_Roles.PORTAL_USERS, ...Object.values(GlobalRoles))
    @Get("/test")
    @Header("content-type", "application/json; charset=utf-8")
    // @Header("Suspend-Reauth", "1")
    test(@Query() params: any, @Res() res: Response) {
        return this.glpiService.Test(res, params)
    }

    // endregion
}
