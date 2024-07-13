import {ApiProperty} from '@nestjs/swagger';

/**region [ Global ] */
export type RequestTypeEnum = 1 | 2  // 1 - инцидент, 2 - запрос
export type StatusEnum = 1 | 2 | 3 | 4 | 5 | 6  // 1 - новая, 2 - в работе, 3 - запланирована, 4 - в ожидании, 5 - решена, 6 - закрыта
export type MemberTypeEnum = 1 | 2  // 1 - пользователь, 2 - группа
export type AccessoryTypeEnum = 1 | 2 | 3  // 1 - инициатор, 2 - исполнитель, 3 - наблюдатель
export type ChatItemTypeEnum = 'Service' | 'Blank' | 'Message' | 'File' | 'Image' | 'Solution'
export type sideTypeEnum = 1 | 2  // 0 - право, 1 - лево

/**
 * @param {string} name
 */
export class RequestUsernameDto {
    @ApiProperty()
    username: string
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
 * @param {string} username
 */
export class RequestTicketIdAndUsernameDto {
    @ApiProperty()
    id: number

    @ApiProperty()
    username: string
}

// endregion

/**region [ Ticket list ] */
/**region [ Requests ] */
// endregion

/**region [ Response ] */
/**
 * @param {number} id
 * @param {RequestTypeEnum} type
 * @param {string} name
 * @param {StatusEnum} status
 * @param {string} category
 * @param {string} date_creation
 * @param {string} time_to_resolve
 */
export class UserTicketsResponse {
    @ApiProperty()
    id: number

    @ApiProperty({description: '1 - инцидент, 2 - запрос', enum: [1,2]})
    type: RequestTypeEnum

    @ApiProperty()
    name: string

    @ApiProperty({description: '1 - новая, 2 - в работе, 3 - запланирована, 4 - в ожидании, 5 - решена, 6 - закрыта', enum: [1,2,3,4,5,6]})
    status: StatusEnum

    @ApiProperty()
    category: string

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

    @ApiProperty({description: '1 - пользователь, 2 - группа', enum: [1, 2]})
    memberType: MemberTypeEnum

    @ApiProperty({description: '1 - инициатор, 2 - исполнитель, 3 - наблюдатель', enum: [1, 2, 3]})
    accessoryType: AccessoryTypeEnum
}

// endregion
// endregion

/**region [ Ticket info ] */

/**region [ Requests ] */
/**
 * @param {number} ticket_id
 * @param {string} username
 * @param {string} text
 */
export class TicketFollowupDto {
    @ApiProperty()
    ticket_id: number

    @ApiProperty()
    username: string

    @ApiProperty()
    text: string
}

// endregion

/**region [ Response ] */
/**
 * @param {boolean} access
 * @param {boolean} found
 */
export class UserAccessOnTicket {
    @ApiProperty()
    access: boolean

    @ApiProperty()
    found: boolean
}

/**
 * @param {number} id
 * @param {string} name
 * @param {StatusEnum} status
 * @param {RequestTypeEnum} type
 * @param {string} category
 * @param {string} date_creation
 * @param {string} time_to_resolve
 * @param {string} solvedate
 * @param {string} closedate
 * @param {string} content
 */
export class TicketInfoResponse {
    @ApiProperty()
    id: number

    @ApiProperty()
    name: string

    @ApiProperty({description: '1 - новая, 2 - в работе, 3 - запланирована, 4 - в ожидании, 5 - решена, 6 - закрыта', enum: [1,2,3,4,5,6]})
    status: StatusEnum

    @ApiProperty({description: '1 - инцидент, 2 - запрос', enum: [1,2]})
    type: RequestTypeEnum

    @ApiProperty()
    category: string

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
 * @param {MemberTypeEnum} memberType
 * @param {AccessoryTypeEnum} accessoryType
 * @param {string | null} phone
 */
export class TicketMembersResponse {
    @ApiProperty()
    id: number

    @ApiProperty()
    name: string

    @ApiProperty({description: '1 - пользователь, 2 - группа', enum: [1, 2]})
    memberType: MemberTypeEnum

    @ApiProperty({description: '1 - инициатор, 2 - исполнитель, 3 - наблюдатель', enum: [1, 2, 3]})
    accessoryType: AccessoryTypeEnum

    @ApiProperty()
    phone: string | null
}

/**
 * @param {number} userId
 * @param {string} name
 * @param {boolean} sideLeft
 * @param {number} id
 * @param {ChatItemTypeEnum} type
 * @param {string} text
 * @param {string} time
 */
export class TicketChatResponse {
    @ApiProperty()
    userId: number

    @ApiProperty()
    name: string

    @ApiProperty({description: '0 - право, 1 - лево', enum: [0, 1]})
    sideLeft: sideTypeEnum

    @ApiProperty()
    id: number

    @ApiProperty({description: 'Ticket description = Message', enum: ['Service', 'Blank', 'Message', 'File', 'Image', 'Solution']})
    type: ChatItemTypeEnum

    @ApiProperty()
    text: string

    @ApiProperty()
    time: string
}

/**
 * @param {number} fieldCount
 * @param {number} affectedRows
 * @param {number} insertId
 * @param {number} serverStatus
 * @param {number} warningCount
 * @param {string} message
 * @param {boolean} protocol41
 * @param {number} changedRows
 */
export class TicketFollowupsResponse {
    @ApiProperty()
    fieldCount: number

    @ApiProperty()
    affectedRows: number

    @ApiProperty()
    insertId: number

    @ApiProperty()
    serverStatus: number

    @ApiProperty()
    warningCount: number

    @ApiProperty()
    message: string

    @ApiProperty()
    protocol41: boolean

    @ApiProperty()
    changedRows: number
}

// endregion
// endregion

/**region [ Phonebook ] */
/**region [ Requests ] */
// endregion

/**region [ Response ] */
/**
 * @param {number} group_id
 * @param {string} group_name
 * @param {number} id
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 */
export class GlpiUsersInGroupsResponse {
    @ApiProperty()
    group_id: number

    @ApiProperty()
    group_name: string

    @ApiProperty()
    id: number

    @ApiProperty()
    name: string

    @ApiProperty()
    email: string

    @ApiProperty()
    phone: string
}

// endregion
// endregion

/**region [ GLPI API ] */

/**region [ Requests ] */
export class RequestTicketIdAndUsernameAndFileNameDto {
    @ApiProperty()
    id: number

    @ApiProperty()
    username: string

    @ApiProperty()
    filename: string
}
// endregion

/**region [ Response ] */
/**
 * @param {number} id
 * @param {string} message
 * @param {number} userId
 * @param {string} userFio
 */
export class CreateTicketFollowupResponse {
    @ApiProperty()
    id: number

    @ApiProperty()
    message: string

    @ApiProperty()
    userId: number

    @ApiProperty()
    userFio: string
}

/**
 * @param {string} name
 * @param {number} size
 * @param {string} type
 * @param {string} url
 * @param {string} deleteUrl
 * @param {string} deleteType
 * @param {string} prefix
 * @param {string} display
 * @param {string} filesize
 * @param {string} id
 */
class UploadTicketDocumentUploadResult {
    @ApiProperty()
    name: string

    @ApiProperty()
    size: number

    @ApiProperty()
    type: string

    @ApiProperty()
    url: string

    @ApiProperty()
    deleteUrl: string

    @ApiProperty()
    deleteType: string

    @ApiProperty()
    prefix: string

    @ApiProperty()
    display: string

    @ApiProperty()
    filesize: string

    @ApiProperty()
    id: string
}

/**
 * @param {number} status
 * @param {number} ticket_id
 * @param {number} id
 * @param {string} message
 * @param {{ string: UploadTicketDocumentUploadResult[] }} upload_result
 */
export class UploadTicketDocumentResponse {
    @ApiProperty()
    status: number

    @ApiProperty()
    ticket_id: number

    @ApiProperty()
    id: number

    @ApiProperty()
    message: string

    @ApiProperty()
    upload_result: { string: UploadTicketDocumentUploadResult[] }

}

/**
 * @param {number} id
 * @param {boolean} asFile
 * @param {string} fileName
 * @param {number} fileSize
 * @param {number} fileWidth
 * @param {number} fileHeight
 * @param {string} mime
 * @param {string} base64
 */
export class ResponseGetImagePreviewResponse {

    @ApiProperty()
    id: number

    @ApiProperty()
    asFile: boolean

    @ApiProperty()
    fileName: string

    @ApiProperty()
    fileSize: number

    @ApiProperty()
    fileWidth: number

    @ApiProperty()
    fileHeight: number

    @ApiProperty()
    base64: string
}

// endregion
// endregion
