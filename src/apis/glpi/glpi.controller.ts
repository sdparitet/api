import {Body, Controller, Header, Post, Res} from "@nestjs/common";
import {ApiTags, ApiBody, ApiResponse} from '@nestjs/swagger';
import {Roles} from '~guards/roles-auth.decorator';
import {GlobalRoles} from '~roles/All-roles';
import {GLPI_Roles} from '~roles/glpi.roles';
import {GLPI_Service} from '~glpi/glpi.service';
import {
    IGetTicketInfoResponse,
    IGetTicketUsersResponse,
    IGetTicketFollowupsResponse,
    IRequestUsernameDto,
    IRequestTicketIdDto,
    IUserTicketsResponse,
    ITicketsMembersResponse,
} from '~glpi/dto/post-request-dto';
import {Response} from "express";

import {GLPI_DB_CONNECTION} from '~root/src/constants';

@ApiTags(GLPI_DB_CONNECTION)
@Controller("glpi")
export class GLPI_Controller {
    constructor(private glpiService: GLPI_Service) {
    }

    /**region [ Ticket list ] */
    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Post("/GetUserTickets")
    @Header("content-type", "application/json")
    @ApiBody({required: false, type: IRequestUsernameDto})
    @ApiResponse({type: [IUserTicketsResponse]})
    gut(@Body() dto: IRequestUsernameDto, @Res() res: Response) {
        return this.glpiService.GetUserTickets(dto, res);
    }

    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Post("/GetTicketsMembers")
    @Header("content-type", "application/json")
    @ApiBody({required: true, type: IRequestUsernameDto})
    @ApiResponse({type: [ITicketsMembersResponse]})
    gtm(@Body() dto: IRequestUsernameDto, @Res() res: Response) {
        return this.glpiService.GetTicketsMembers(dto, res);
    }

    // endregion

    //ToDo CHECK & CHANGE
    /**region [ Ticket info ] */
    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Post("/GetTicketInfoByID")
    @Header("content-type", "application/json")
    @ApiBody({required: true, type: IRequestTicketIdDto})
    @ApiResponse({type: [IGetTicketInfoResponse]})
    gtibi(@Body() dto: IRequestTicketIdDto, @Res() res: Response) {
        return this.glpiService.GetTicketInfoByID(dto, res);
    }

    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Post("/GetTicketUsersByTicketID")
    @Header("content-type", "application/json")
    @ApiBody({required: true, type: IRequestTicketIdDto})
    @ApiResponse({type: [IGetTicketUsersResponse]})
    gtubti(@Body() dto: IRequestTicketIdDto, @Res() res: Response) {
        return this.glpiService.GetTicketUsersByTicketID(dto, res);
    }

    @Roles(GLPI_Roles.GLPI_DATA, ...Object.values(GlobalRoles))
    @Post("/GetTicketFollowupsByTicketID")
    @Header("content-type", "application/json")
    @ApiBody({required: true, type: IRequestTicketIdDto})
    @ApiResponse({type: [IGetTicketFollowupsResponse]})
    gtfbti(@Body() dto: IRequestTicketIdDto, @Res() res: Response) {
        return this.glpiService.GetTicketFollowupsByTicketID(dto, res);
    }

    // endregion

}
