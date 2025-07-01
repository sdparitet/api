// region [ GLPI API ]
export interface IGlpiSession {
    session_token: string
    session: {
        glpiID: number
        glpifriendlyname: string
        glpiname: string
        glpirealname: string
        glpifirstname: string
        glpidefault_entity: number
        glpiextauth: 0 | 1
        glpiauthtype: number
        glpiprofiles: {
            [key: string]: {
                name: string
                entities: {
                    id: number
                    name: string
                    is_recursive: 0 | 1
                }[]
            }
        }
        glpiactiveprofile: {
            id: number
            name: string
            interface: InterfaceType
            helpdesk_item_type: ItemType[]
            ticket_status: null | [] | Partial<Record<'1' | '2' | '3' | '4' | '5' | '6',
                Record<'1' | '2' | '3' | '4' | '5' | '6', 0 | 1>>>
            ticketvalidation: number
            ticket: number
            followup: number
            task: number
        }
    }
}

export type InterfaceType = 'central' | 'helpdesk'

export type ItemType = "Computer"
    | "Monitor"
    | "NetworkEquipment"
    | "Peripheral"
    | "Phone"
    | "Printer"
    | "Software"
    | "DCRoom"
    | "Rack"
    | "Enclosure"

export type PayloadType = {
    [key: string]: number | string | boolean
}

export interface ISearch {
    criteria: CriteriaType[]
    forcedisplay?: number[]
    sort?: number
    order?: 'ASC' | 'DESC'
}

export type CriteriaType = {
    link?: 'AND' | 'OR'
    field?: number
    searchtype?: 'contains' | 'equals' | 'equal' | 'notequals' | 'lessthan' | 'morethan' | 'under' | 'notunder'
    value?: string | number
    criteria?: CriteriaType[]
}

export type GlpiApiResponse = { status: number, data: any }
export type GlpiApiInitResponse = { status: number, data: IGlpiSession }
// endregion

// region [ Profile rights ]
export const enum RightsType {
    TICKET = 'ticket',
    FOLLOWUP = 'followup',
    TASK = 'task',
    STATUS = 'status',
    AGREEMENT = 'ticketvalidation',
}

export enum TicketStatuses {
    NEW = 1,
    ASSIGN = 2,
    PLANNED = 3,
    PENDING = 4,
    SOLVED = 5,
    CLOSED = 6
}

export type ITicketStatusesRights = Record<TicketStatuses, Record<TicketStatuses, boolean>>

// region [ Central ]
/**
 * @param {boolean} canAcceptOrDenySolve
 * @param {boolean} canChangePriority
 * @param {boolean} canTakeTicket
 * @param {boolean} canTakeAnyTicket
 * @param {boolean} canAssignUsersOnTicket
 * @param {boolean} canViewAssignToMeTickets
 * @param {boolean} canViewAssignToMyGroupTickets
 * @param {boolean} canViewAllTickets
 * @param {boolean} canPermanentDeleteTicket
 * @param {boolean} canDeleteTicket
 * @param {boolean} canCreateTicket
 * @param {boolean} canChangeTicket
 * @param {boolean} canViewTickets
 */
export interface ITicketRights {
    canAcceptOrDenySolve: boolean
    canChangePriority: boolean
    canTakeTicket: boolean
    canTakeAnyTicket: boolean
    canAssignUsersOnTicket: boolean
    canViewAssignToMeTickets: boolean
    canViewAssignToMyGroupTickets: boolean
    canViewAllTickets: boolean
    canPermanentDeleteTicket: boolean
    canDeleteTicket: boolean
    canCreateTicket: boolean
    canChangeTicket: boolean
    canViewTickets: boolean
}

/**
 * @param {boolean} canViewHiddenFollowups
 * @param {boolean} canCreateFollowupsInAnyTicket
 * @param {boolean} canCreateFollowupsInMyGroups
 * @param {boolean} canChangeAnyFollowups
 * @param {boolean} canDeleteFollowups
 * @param {boolean} canCreateFollowups
 * @param {boolean} canChangeFollowups
 * @param {boolean} canViewPublicFollowups
 */
export interface IFollowupRights {
    canViewHiddenFollowups: boolean
    canCreateFollowupsInAnyTicket: boolean
    canCreateFollowupsInMyGroups: boolean
    canChangeAnyFollowups: boolean
    canDeleteFollowups: boolean
    canCreateFollowups: boolean
    canChangeFollowups: boolean
    canViewPublicFollowups: boolean
}

/**
 * @param {boolean} canViewHiddenTasks
 * @param {boolean} canCreateTaskInAnyTickets
 * @param {boolean} canChangeAnyTask
 * @param {boolean} canDeleteTasks
 * @param {boolean} canViewPublicTasks
 */
export interface ITaskRights {
    canViewHiddenTasks: boolean
    canCreateTaskInAnyTickets: boolean
    canChangeAnyTask: boolean
    canDeleteTasks: boolean
    canViewPublicTasks: boolean
}

export interface IAgreementRights {
    canDeleteAgreement: boolean
    canCreateRequestAgreement: boolean
    canCreateIncidentAgreement: boolean
    canAnswerRequestAgreement: boolean
    canAnswerIncidentAgreement: boolean
}

// endregion
// endregion
