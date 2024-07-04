import {ApiProperty} from '@nestjs/swagger';

/**region [ Global ] */
/**
 * @param {string} name
 */
export class RequestUsernameDto {
    @ApiProperty()
    name: string
}

/**
 * @param {number} id
 */
export class RequestTicketIdDto {
    @ApiProperty()
    id: number
}

/**
 * @param {number} id
 * @param {string} name
 */
export class RequestTicketIdAndUsernameDto {
    @ApiProperty()
    id: number

    @ApiProperty()
    name: string
}

// endregion

/**region [ Ticket list ] */
/**
 * @param {boolean} access
 */
export class RequestUserAccessOnTicket {
    @ApiProperty()
    access: boolean

    @ApiProperty()
    found: boolean
}

/**
 * @param {number} id
 * @param {number} type
 * @param {string} name
 * @param {string} category
 * @param {string} date_creation
 * @param {string} time_to_solve
 */
export class UserTicketsResponse {
    @ApiProperty()
    id: number

    @ApiProperty()
    type: number

    @ApiProperty()
    name: string

    @ApiProperty()
    category: string

    @ApiProperty()
    specialists: string

    @ApiProperty()
    specialistsGroups: string

    @ApiProperty({example: '2024-01-01T00:00:00.000Z'})
    date_creation: string

    @ApiProperty({example: '2024-01-01T00:00:00.000Z'})
    time_to_resolve: string
}


/**
 * @param {number} ticket_id
 * @param {string} name
 * @param {number} type
 */
export class TicketsMembersResponse {
    @ApiProperty()
    ticket_id: number

    @ApiProperty()
    id: number

    @ApiProperty()
    name: string

    @ApiProperty()
    memberType: 1 | 2         // 1 - user, 2 - group

    @ApiProperty()
    accessoryType: 1 | 2 | 3  // 1 - applicants, 2 - specialists, 3 - watchers
}

// endregion

/**region [ Ticket info ] */
/**
 * @param {number} id
 * @param {string} name
 * @param {number} status
 * @param {number} type
 * @param {string} completename
 * @param {string} date_creation
 * @param {string} time_to_resolve
 * @param {string} solvedate
 * @param {string} closedate
 * @param {string} content
 */
export class GetTicketInfoResponse {
    @ApiProperty()
    id: number

    @ApiProperty()
    name: string

    @ApiProperty()
    status: number

    @ApiProperty()
    type: number

    @ApiProperty()
    completename: string

    @ApiProperty()
    date_creation: string

    @ApiProperty()
    time_to_resolve: string

    @ApiProperty()
    solvedate: string

    @ApiProperty()
    closedate: string
}

/**
 * @param {number} id
 * @param {string} name
 * @param {number} type
 * @param {number} itemType
 */
export class GetTicketUsersResponse {
    @ApiProperty()
    id: number

    @ApiProperty()
    name: string

    @ApiProperty()
    accessoryType: number

    @ApiProperty()
    memberType: number
}

/**
 * @param {string} type
 * @param {number} id
 * @param {number} item_id
 * @param {string} name
 * @param {string} content
 * @param {string} data
 * @param {string} date
 */
export class GetTicketFollowupsResponse {
    @ApiProperty()
    type: string

    @ApiProperty()
    id: number

    @ApiProperty()
    ticket_id: number

    @ApiProperty()
    author_type: number

    @ApiProperty()
    name: string

    @ApiProperty()
    content: string

    @ApiProperty()
    data: string

    @ApiProperty()
    date: string
}

/**
 * @param {number} ticket_id
 * @param {string} username
 * @param {string} content
 */
export class SetTicketFollowupsDto {
    @ApiProperty()
    ticket_id: number

    @ApiProperty()
    username: string

    @ApiProperty()
    content: string
}

/**
 * @param {boolean} success
 */
export class SetTicketFollowupsResponse {
    @ApiProperty()
    access: boolean
}

// endregion

/**region [ Test ] */
export class RequestBaseDto {
    @ApiProperty()
    username: string
}

export class CreateTicketFollowupDto {
    @ApiProperty()
    ticket_id: number

    @ApiProperty()
    username: string

    @ApiProperty()
    content: string
}

/**
 * @param {string} username
 * @param {number} ticket_id
 */
export class RequestFileUploadDto {
    @ApiProperty()
    username: string

    @ApiProperty()
    ticket_id: number
}

/**
 * @param {string} username
 * @param {number} id
 */
export class RequestDownloadDocumentDto {
    @ApiProperty()
    name: string

    @ApiProperty()
    id: number
}

// endregion
