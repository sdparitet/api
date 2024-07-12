import {
    Body,
    Controller,
    Get,
    Header,
    Post, Query,
    Res,
    UploadedFile,
    UseInterceptors
} from "@nestjs/common";
import {ApiTags, ApiBody, ApiResponse} from '@nestjs/swagger';
import {Roles} from '~guards/roles-auth.decorator';
import {GlobalRoles} from '~roles/All-roles';
import {GLPI_Roles} from '~roles/glpi.roles';
import {GLPI_Service} from '~glpi/glpi.service';
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
    TicketFollowupsResponse,
    UserAccessOnTicket,
    CreateTicketFollowupResponse,
    ResponseGetImagePreviewResponse,
    GlpiUsersInGroupsResponse,
    UploadTicketDocumentResponse,
} from '~glpi/dto/post-request-dto';
import {Response, Express} from "express";

import {GLPI_DB_CONNECTION} from '~root/src/constants';
import {GetImagePreviewParams} from "~glpi/dto/get-request-dto";
import {FileInterceptor} from "@nestjs/platform-express";

@ApiTags(GLPI_DB_CONNECTION)
@Controller("glpi")
export class GLPI_Controller {
    constructor(
        private glpiService: GLPI_Service,
    ) {
    }

    /**region [ Ticket list ] */
    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Post("/GetUserTickets")
    @Header("content-type", "application/json")
    @ApiBody({required: false, type: RequestUsernameDto})
    @ApiResponse({type: [UserTicketsResponse]})
    gut(@Body() dto: RequestUsernameDto, @Res() res: Response) {
        return this.glpiService.GetUserTickets(dto, res);
    }

    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Post("/GetTicketsMembers")
    @Header("content-type", "application/json")
    @ApiBody({required: true, type: RequestUsernameDto})
    @ApiResponse({type: [TicketsMembersResponse]})
    gtm(@Body() dto: RequestUsernameDto, @Res() res: Response) {
        return this.glpiService.GetTicketsMembers(dto, res);
    }

    // endregion

    /**region [ Ticket info ] */
    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Post("/GetUserAccessOnTicket")
    @Header("content-type", "application/json")
    @ApiBody({required: true, type: RequestTicketIdAndUsernameDto})
    @ApiResponse({type: [UserAccessOnTicket]})
    guaot(@Body() dto: RequestTicketIdAndUsernameDto, @Res() res: Response) {
        return this.glpiService.GetUserAccessOnTicket(dto, res);
    }

    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Post("/GetTicketInfo")
    @Header("content-type", "application/json")
    @ApiBody({required: true, type: RequestTicketIdAndUsernameDto})
    @ApiResponse({type: [TicketInfoResponse]})
    gtibi(@Body() dto: RequestTicketIdAndUsernameDto, @Res() res: Response) {
        return this.glpiService.GetTicketInfo(dto, res);
    }

    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Post("/GetTicketMembers")
    @Header("content-type", "application/json")
    @ApiBody({required: true, type: RequestTicketIdDto})
    @ApiResponse({type: [TicketMembersResponse]})
    gtubti(@Body() dto: RequestTicketIdDto, @Res() res: Response) {
        return this.glpiService.GetTicketMembers(dto, res);
    }

    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Post("/GetTicketChat")
    @Header("content-type", "application/json")
    @ApiBody({required: true, type: RequestTicketIdAndUsernameDto})
    @ApiResponse({type: [TicketChatResponse]})
    gtfbti(@Body() dto: RequestTicketIdAndUsernameDto, @Res() res: Response) {
        return this.glpiService.GetTicketChat(dto, res);
    }

    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Post("/OldCreateTicketFollowup")
    @Header("content-type", "application/json")
    @ApiBody({required: true, type: TicketFollowupDto})
    @ApiResponse({type: [TicketFollowupsResponse]})
    stf(@Body() dto: TicketFollowupDto, @Res() res: Response) {
        return this.glpiService.OldCreateTicketFollowup(dto, res);
    }

    // endregion

    /**region [ Phonebook ] */
    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Get("/GetGlpiUsersInGroups")
    @Header("content-type", "application/json")
    @ApiResponse({type: [GlpiUsersInGroupsResponse]})
    gguig(@Res() res: Response) {
        return this.glpiService.GetGlpiUsersInGroups(res);
    }

    // endregion

    /**region [GLPI API] */
    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Post("/CreateTicketFollowup")
    @Header("content-type", "application/json")
    @ApiBody({required: true, type: TicketFollowupDto})
    @ApiResponse({type: [CreateTicketFollowupResponse]})
    ctf(@Body() dto: TicketFollowupDto, @Res() res: Response) {
        return this.glpiService.CreateTicketFollowup(dto, res);
    }

    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Post("/UploadTicketDocument")
    @ApiBody({required: true, type: RequestTicketIdAndUsernameDto})
    @ApiResponse({type: [UploadTicketDocumentResponse]})
    @UseInterceptors(FileInterceptor('file'))
    ud(@UploadedFile() file: Express.Multer.File, @Body() dto: RequestTicketIdAndUsernameDto, @Res() res: Response) {
        return this.glpiService.UploadTicketDocument(file, dto, res);
    }

    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Post("/DownloadDocument")
    @Header("content-type", "application/octet-stream")
    @ApiBody({required: true, type: RequestTicketIdAndUsernameDto})
    dd(@Body() dto: RequestTicketIdAndUsernameDto, @Res() res: Response) {
        return this.glpiService.DownloadDocument(dto, res);
    }

    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Get("/GetImagePreview")
    @Header("content-type", "application/json; charset=utf-8")
    @ApiResponse({type: [ResponseGetImagePreviewResponse]})
    test(@Query() params: GetImagePreviewParams, @Res() res: Response) {
        return this.glpiService.GetImagePreview(params, res);
    }

    // endregion
}
