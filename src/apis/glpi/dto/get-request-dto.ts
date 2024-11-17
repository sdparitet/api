import { ApiProperty } from "@nestjs/swagger"
import {
    IAgreementRights,
    IFollowupRights,
    ITaskRights,
    ITicketRights,
    ITicketStatusesRights
} from '~connectors/glpi/types'

/**
 * @param {number} id
 * @param {string} username
 */
export class GetImagePreviewParams {
    @ApiProperty()
    id: number

    @ApiProperty()
    username: string
}


export class GetAgreementUserParams {
    @ApiProperty()
    ticketType: 1 | 2
}

/**
 * @param {0 | 1} interface
 * @param {ITicketRights} ticket
 * @param {IFollowupRights} followup
 * @param {ITaskRights} task
 * @param {ITicketStatusesRights} status
 */
export class GetUserAccessResponse {
    @ApiProperty()
    glpiId: number

    @ApiProperty()
    iface: 0 | 1

    @ApiProperty()
    ticket: ITicketRights

    @ApiProperty()
    followup: IFollowupRights

    @ApiProperty()
    task: ITaskRights

    @ApiProperty()
    status: ITicketStatusesRights

    @ApiProperty()
    agreement: IAgreementRights
}


