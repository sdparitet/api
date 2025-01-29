import {
    ITicketRights,
    ITicketStatusesRights,
    IFollowupRights,
    ITaskRights,
    RightsType,
    InterfaceType,
    TicketStatuses, IGlpiSession, IAgreementRights
} from "~connectors/glpi/types"

export class Helper {
    private readonly sessionInfo: IGlpiSession['session']
    private readonly _interface: InterfaceType

    private _id: number
    private _name: string
    private _ticketRights: ITicketRights
    private _followupRights: IFollowupRights
    private _taskRights: Partial<ITaskRights>
    private _validateRights: IAgreementRights
    private _maxRightsLength: Record<Exclude<RightsType, RightsType.STATUS>, Record<InterfaceType, number>> = {
        [RightsType.TICKET]: { central: 18, helpdesk: 12 },
        [RightsType.FOLLOWUP]: { central: 13, helpdesk: 11 },
        [RightsType.TASK]: { central: 13, helpdesk: 1 },
        [RightsType.AGREEMENT]: { central: 14, helpdesk: 1 },
    }

    private _ticketStatusesRights: ITicketStatusesRights

    constructor(fullSession: IGlpiSession) {
        this.sessionInfo = fullSession.session
        this._interface = this.sessionInfo.glpiactiveprofile.interface
    }

    private async _ParseSession() {
        const activeProfile = this.sessionInfo.glpiactiveprofile
        this._id = activeProfile.id
        this._name = activeProfile.name
        this._ticketRights = await this._ParseRights(RightsType.TICKET, activeProfile.ticket) as ITicketRights
        this._followupRights = await this._ParseRights(RightsType.FOLLOWUP, activeProfile.followup) as IFollowupRights
        this._taskRights = await this._ParseRights(RightsType.TASK, activeProfile.task) as ITaskRights
        this._validateRights = await this._ParseRights(RightsType.AGREEMENT, activeProfile.ticketvalidation) as IAgreementRights
        this._ticketStatusesRights = await this._ParseStatuses()
    }

    private async _ParseRights(type: RightsType, rightsMask: number) {
        const byteMask = rightsMask.toString(2).padStart(this._maxRightsLength[type][this._interface], '0')

        switch (type) {
            case RightsType.TICKET:
                if (this._interface === 'central') {
                    return {
                        canAcceptOrDenySolve: byteMask[0] === '1',
                        canChangePriority: byteMask[1] === '1',
                        canTakeTicket: byteMask[2] === '1',
                        canTakeAnyTicket: byteMask[3] === '1',
                        canAssignUsersOnTicket: byteMask[4] === '1',
                        canViewAssignToMeTickets: byteMask[5] === '1',
                        canViewAssignToMyGroupTickets: byteMask[6] === '1',
                        canViewAllTickets: byteMask[7] === '1',
                        canPermanentDeleteTicket: byteMask[14] === '1',
                        canDeleteTicket: byteMask[15] === '1',
                        canChangeTicket: byteMask[16] === '1',
                        canCreateTicket: byteMask[17] === '1',
                        canViewTickets: byteMask[18] === '1',
                    } as ITicketRights
                } else {
                    return {
                        canAcceptOrDenySolve: true,
                        canChangePriority: false,
                        canTakeTicket: false,
                        canTakeAnyTicket: false,
                        canAssignUsersOnTicket: false,
                        canViewAssignToMeTickets: false,
                        canViewAssignToMyGroupTickets: byteMask[0] === '1',
                        canViewAllTickets: false,
                        canPermanentDeleteTicket: false,
                        canDeleteTicket: false,
                        canChangeTicket: false,
                        canCreateTicket: byteMask[9] === '1',
                        canViewTickets: byteMask[11] === '1',
                    } as ITicketRights
                }
            case RightsType.FOLLOWUP:
                if (this._interface === 'central') {
                    return {
                        canViewHiddenFollowups: byteMask[0] === '1',
                        canCreateFollowupsInAnyTicket: byteMask[1] === '1',
                        canCreateFollowupsInMyGroups: byteMask[2] === '1',
                        canChangeAnyFollowups: byteMask[3] === '1',
                        canDeleteFollowups: byteMask[9] === '1',
                        canCreateFollowups: byteMask[11] === '1',
                        canChangeFollowups: byteMask[12] === '1',
                        canViewPublicFollowups: byteMask[13] === '1',
                    } as IFollowupRights
                } else {
                    return {
                        canViewHiddenFollowups: false,
                        canCreateFollowupsInAnyTicket: false,
                        canCreateFollowupsInMyGroups: byteMask[0] === '1',
                        canChangeAnyFollowups: false,
                        canDeleteFollowups: false,
                        canCreateFollowups: byteMask[9] === '1',
                        canChangeFollowups: byteMask[10] === '1',
                        canViewPublicFollowups: byteMask[11] === '1',
                    } as IFollowupRights
                }
            case RightsType.TASK:
                if (this._interface === 'central') {
                    return {
                        canViewHiddenTasks: byteMask[0] === '1',
                        canCreateTaskInAnyTickets: byteMask[1] === '1',
                        canChangeAnyTask: byteMask[3] === '1',
                        canDeleteTasks: byteMask[9] === '1',
                        canViewPublicTasks: byteMask[13] === '1',
                    } as ITaskRights
                } else {
                    return {
                        canViewHiddenTasks: false,
                        canCreateTaskInAnyTickets: false,
                        canChangeAnyTask: false,
                        canDeleteTasks: false,
                        canViewPublicTasks: byteMask[0] === '1',
                    } as ITaskRights
                }
            case RightsType.AGREEMENT:
                if (this._interface === 'central') {
                    return {
                        canDeleteAgreement: byteMask[9] === '1',
                        canCreateRequestAgreement: byteMask[3] === '1',
                        canCreateIncidentAgreement: byteMask[2] === '1',
                        canAnswerRequestAgreement: byteMask[1] === '1',
                        canAnswerIncidentAgreement: byteMask[0] === '1',
                    } as IAgreementRights
                } else {
                    return {

                        canDeleteAgreement: false,
                        canCreateRequestAgreement: false,
                        canCreateIncidentAgreement: false,
                        canAnswerRequestAgreement: false,
                        canAnswerIncidentAgreement: false,
                    } as IAgreementRights
                }
        }
    }

    private async _ParseStatuses() {
        const statuses = this.sessionInfo.glpiactiveprofile.ticket_status
        let parsedStatuses: ITicketStatusesRights

        if (statuses === null || (Array.isArray(statuses) && statuses.length === 0)) {
            this._interface === 'central'
                ? parsedStatuses = {
                    [TicketStatuses.NEW]: {
                        [TicketStatuses.NEW]: false,
                        [TicketStatuses.ASSIGN]: true,
                        [TicketStatuses.PLANNED]: true,
                        [TicketStatuses.PENDING]: true,
                        [TicketStatuses.SOLVED]: true,
                        [TicketStatuses.CLOSED]: true
                    },
                    [TicketStatuses.ASSIGN]: {
                        [TicketStatuses.NEW]: true,
                        [TicketStatuses.ASSIGN]: false,
                        [TicketStatuses.PLANNED]: true,
                        [TicketStatuses.PENDING]: true,
                        [TicketStatuses.SOLVED]: true,
                        [TicketStatuses.CLOSED]: true
                    },
                    [TicketStatuses.PLANNED]: {
                        [TicketStatuses.NEW]: true,
                        [TicketStatuses.ASSIGN]: true,
                        [TicketStatuses.PLANNED]: false,
                        [TicketStatuses.PENDING]: true,
                        [TicketStatuses.SOLVED]: true,
                        [TicketStatuses.CLOSED]: true
                    },
                    [TicketStatuses.PENDING]: {
                        [TicketStatuses.NEW]: true,
                        [TicketStatuses.ASSIGN]: true,
                        [TicketStatuses.PLANNED]: true,
                        [TicketStatuses.PENDING]: false,
                        [TicketStatuses.SOLVED]: true,
                        [TicketStatuses.CLOSED]: true
                    },
                    [TicketStatuses.SOLVED]: {
                        [TicketStatuses.NEW]: true,
                        [TicketStatuses.ASSIGN]: true,
                        [TicketStatuses.PLANNED]: true,
                        [TicketStatuses.PENDING]: true,
                        [TicketStatuses.SOLVED]: false,
                        [TicketStatuses.CLOSED]: true
                    },
                    [TicketStatuses.CLOSED]: {
                        [TicketStatuses.NEW]: true,
                        [TicketStatuses.ASSIGN]: true,
                        [TicketStatuses.PLANNED]: true,
                        [TicketStatuses.PENDING]: true,
                        [TicketStatuses.SOLVED]: true,
                        [TicketStatuses.CLOSED]: false,
                    },
                }
                : parsedStatuses = {
                    [TicketStatuses.NEW]: {
                        [TicketStatuses.NEW]: false,
                        [TicketStatuses.ASSIGN]: false,
                        [TicketStatuses.PLANNED]: false,
                        [TicketStatuses.PENDING]: false,
                        [TicketStatuses.SOLVED]: false,
                        [TicketStatuses.CLOSED]: false,
                    },
                    [TicketStatuses.ASSIGN]: {
                        [TicketStatuses.NEW]: false,
                        [TicketStatuses.ASSIGN]: false,
                        [TicketStatuses.PLANNED]: false,
                        [TicketStatuses.PENDING]: false,
                        [TicketStatuses.SOLVED]: false,
                        [TicketStatuses.CLOSED]: false,
                    },
                    [TicketStatuses.PLANNED]: {
                        [TicketStatuses.NEW]: false,
                        [TicketStatuses.ASSIGN]: false,
                        [TicketStatuses.PLANNED]: false,
                        [TicketStatuses.PENDING]: false,
                        [TicketStatuses.SOLVED]: false,
                        [TicketStatuses.CLOSED]: false,
                    },
                    [TicketStatuses.PENDING]: {
                        [TicketStatuses.NEW]: false,
                        [TicketStatuses.ASSIGN]: false,
                        [TicketStatuses.PLANNED]: false,
                        [TicketStatuses.PENDING]: false,
                        [TicketStatuses.SOLVED]: false,
                        [TicketStatuses.CLOSED]: false,
                    },
                    [TicketStatuses.SOLVED]: {
                        [TicketStatuses.NEW]: true,
                        [TicketStatuses.ASSIGN]: false,
                        [TicketStatuses.PLANNED]: false,
                        [TicketStatuses.PENDING]: false,
                        [TicketStatuses.SOLVED]: false,
                        [TicketStatuses.CLOSED]: true
                    },
                    [TicketStatuses.CLOSED]: {
                        [TicketStatuses.NEW]: true,
                        [TicketStatuses.ASSIGN]: false,
                        [TicketStatuses.PLANNED]: false,
                        [TicketStatuses.PENDING]: false,
                        [TicketStatuses.SOLVED]: false,
                        [TicketStatuses.CLOSED]: false,
                    },
                }
        } else {
            if (this._interface === 'central') {
                parsedStatuses = {
                    [TicketStatuses.NEW]: {
                        [TicketStatuses.NEW]: false,
                        [TicketStatuses.ASSIGN]: TicketStatuses.NEW.toString() in statuses ? TicketStatuses.ASSIGN.toString() in statuses[TicketStatuses.NEW.toString()] ? statuses[TicketStatuses.NEW.toString()][TicketStatuses.ASSIGN.toString()] === 1 : true : true,
                        [TicketStatuses.PLANNED]: TicketStatuses.NEW.toString() in statuses ? TicketStatuses.PLANNED.toString() in statuses[TicketStatuses.NEW.toString()] ? statuses[TicketStatuses.NEW.toString()][TicketStatuses.PLANNED.toString()] === 1 : true : true,
                        [TicketStatuses.PENDING]: TicketStatuses.NEW.toString() in statuses ? TicketStatuses.PENDING.toString() in statuses[TicketStatuses.NEW.toString()] ? statuses[TicketStatuses.NEW.toString()][TicketStatuses.PENDING.toString()] === 1 : true : true,
                        [TicketStatuses.SOLVED]: TicketStatuses.NEW.toString() in statuses ? TicketStatuses.SOLVED.toString() in statuses[TicketStatuses.NEW.toString()] ? statuses[TicketStatuses.NEW.toString()][TicketStatuses.SOLVED.toString()] === 1 : true : true,
                        [TicketStatuses.CLOSED]: TicketStatuses.NEW.toString() in statuses ? TicketStatuses.CLOSED.toString() in statuses[TicketStatuses.NEW.toString()] ? statuses[TicketStatuses.NEW.toString()][TicketStatuses.CLOSED.toString()] === 1 : true : true,
                    },
                    [TicketStatuses.ASSIGN]: {
                        [TicketStatuses.NEW]: TicketStatuses.ASSIGN.toString() in statuses ? TicketStatuses.NEW.toString() in statuses[TicketStatuses.ASSIGN.toString()] ? statuses[TicketStatuses.ASSIGN.toString()][TicketStatuses.NEW.toString()] === 1 : true : true,
                        [TicketStatuses.ASSIGN]: false,
                        [TicketStatuses.PLANNED]: TicketStatuses.ASSIGN.toString() in statuses ? TicketStatuses.PLANNED.toString() in statuses[TicketStatuses.ASSIGN.toString()] ? statuses[TicketStatuses.ASSIGN.toString()][TicketStatuses.PLANNED.toString()] === 1 : true : true,
                        [TicketStatuses.PENDING]: TicketStatuses.ASSIGN.toString() in statuses ? TicketStatuses.PENDING.toString() in statuses[TicketStatuses.ASSIGN.toString()] ? statuses[TicketStatuses.ASSIGN.toString()][TicketStatuses.PENDING.toString()] === 1 : true : true,
                        [TicketStatuses.SOLVED]: TicketStatuses.ASSIGN.toString() in statuses ? TicketStatuses.SOLVED.toString() in statuses[TicketStatuses.ASSIGN.toString()] ? statuses[TicketStatuses.ASSIGN.toString()][TicketStatuses.SOLVED.toString()] === 1 : true : true,
                        [TicketStatuses.CLOSED]: TicketStatuses.ASSIGN.toString() in statuses ? TicketStatuses.CLOSED.toString() in statuses[TicketStatuses.ASSIGN.toString()] ? statuses[TicketStatuses.ASSIGN.toString()][TicketStatuses.CLOSED.toString()] === 1 : true : true,
                    },
                    [TicketStatuses.PLANNED]: {
                        [TicketStatuses.NEW]: TicketStatuses.PLANNED.toString() in statuses ? TicketStatuses.NEW.toString() in statuses[TicketStatuses.PLANNED.toString()] ? statuses[TicketStatuses.PLANNED.toString()][TicketStatuses.NEW.toString()] === 1 : true : true,
                        [TicketStatuses.ASSIGN]: TicketStatuses.PLANNED.toString() in statuses ? TicketStatuses.ASSIGN.toString() in statuses[TicketStatuses.PLANNED.toString()] ? statuses[TicketStatuses.PLANNED.toString()][TicketStatuses.ASSIGN.toString()] === 1 : true : true,
                        [TicketStatuses.PLANNED]: false,
                        [TicketStatuses.PENDING]: TicketStatuses.PLANNED.toString() in statuses ? TicketStatuses.PENDING.toString() in statuses[TicketStatuses.PLANNED.toString()] ? statuses[TicketStatuses.PLANNED.toString()][TicketStatuses.PENDING.toString()] === 1 : true : true,
                        [TicketStatuses.SOLVED]: TicketStatuses.PLANNED.toString() in statuses ? TicketStatuses.SOLVED.toString() in statuses[TicketStatuses.PLANNED.toString()] ? statuses[TicketStatuses.PLANNED.toString()][TicketStatuses.SOLVED.toString()] === 1 : true : true,
                        [TicketStatuses.CLOSED]: TicketStatuses.PLANNED.toString() in statuses ? TicketStatuses.CLOSED.toString() in statuses[TicketStatuses.PLANNED.toString()] ? statuses[TicketStatuses.PLANNED.toString()][TicketStatuses.CLOSED.toString()] === 1 : true : true,
                    },
                    [TicketStatuses.PENDING]: {
                        [TicketStatuses.NEW]: TicketStatuses.PENDING.toString() in statuses ? TicketStatuses.NEW.toString() in statuses[TicketStatuses.PENDING.toString()] ? statuses[TicketStatuses.PENDING.toString()][TicketStatuses.NEW.toString()] === 1 : true : true,
                        [TicketStatuses.ASSIGN]: TicketStatuses.PENDING.toString() in statuses ? TicketStatuses.ASSIGN.toString() in statuses[TicketStatuses.PENDING.toString()] ? statuses[TicketStatuses.PENDING.toString()][TicketStatuses.ASSIGN.toString()] === 1 : true : true,
                        [TicketStatuses.PLANNED]: TicketStatuses.PENDING.toString() in statuses ? TicketStatuses.PLANNED.toString() in statuses[TicketStatuses.PENDING.toString()] ? statuses[TicketStatuses.PENDING.toString()][TicketStatuses.PLANNED.toString()] === 1 : true : true,
                        [TicketStatuses.PENDING]: false,
                        [TicketStatuses.SOLVED]: TicketStatuses.PENDING.toString() in statuses ? TicketStatuses.SOLVED.toString() in statuses[TicketStatuses.PENDING.toString()] ? statuses[TicketStatuses.PENDING.toString()][TicketStatuses.SOLVED.toString()] === 1 : true : true,
                        [TicketStatuses.CLOSED]: TicketStatuses.PENDING.toString() in statuses ? TicketStatuses.CLOSED.toString() in statuses[TicketStatuses.PENDING.toString()] ? statuses[TicketStatuses.PENDING.toString()][TicketStatuses.CLOSED.toString()] === 1 : true : true,
                    },
                    [TicketStatuses.SOLVED]: {
                        [TicketStatuses.NEW]: TicketStatuses.SOLVED.toString() in statuses ? TicketStatuses.NEW.toString() in statuses[TicketStatuses.SOLVED.toString()] ? statuses[TicketStatuses.SOLVED.toString()][TicketStatuses.NEW.toString()] === 1 : true : true,
                        [TicketStatuses.ASSIGN]: TicketStatuses.SOLVED.toString() in statuses ? TicketStatuses.ASSIGN.toString() in statuses[TicketStatuses.SOLVED.toString()] ? statuses[TicketStatuses.SOLVED.toString()][TicketStatuses.ASSIGN.toString()] === 1 : true : true,
                        [TicketStatuses.PLANNED]: TicketStatuses.SOLVED.toString() in statuses ? TicketStatuses.PLANNED.toString() in statuses[TicketStatuses.SOLVED.toString()] ? statuses[TicketStatuses.SOLVED.toString()][TicketStatuses.PLANNED.toString()] === 1 : true : true,
                        [TicketStatuses.PENDING]: TicketStatuses.SOLVED.toString() in statuses ? TicketStatuses.PENDING.toString() in statuses[TicketStatuses.SOLVED.toString()] ? statuses[TicketStatuses.SOLVED.toString()][TicketStatuses.PENDING.toString()] === 1 : true : true,
                        [TicketStatuses.SOLVED]: false,
                        [TicketStatuses.CLOSED]: TicketStatuses.SOLVED.toString() in statuses ? TicketStatuses.CLOSED.toString() in statuses[TicketStatuses.SOLVED.toString()] ? statuses[TicketStatuses.SOLVED.toString()][TicketStatuses.CLOSED.toString()] === 1 : true : true,
                    },
                    [TicketStatuses.CLOSED]: {
                        [TicketStatuses.NEW]: TicketStatuses.CLOSED.toString() in statuses ? TicketStatuses.NEW.toString() in statuses[TicketStatuses.CLOSED.toString()] ? statuses[TicketStatuses.CLOSED.toString()][TicketStatuses.NEW.toString()] === 1 : true : true,
                        [TicketStatuses.ASSIGN]: TicketStatuses.CLOSED.toString() in statuses ? TicketStatuses.ASSIGN.toString() in statuses[TicketStatuses.CLOSED.toString()] ? statuses[TicketStatuses.CLOSED.toString()][TicketStatuses.ASSIGN.toString()] === 1 : true : true,
                        [TicketStatuses.PLANNED]: TicketStatuses.CLOSED.toString() in statuses ? TicketStatuses.PLANNED.toString() in statuses[TicketStatuses.CLOSED.toString()] ? statuses[TicketStatuses.CLOSED.toString()][TicketStatuses.PLANNED.toString()] === 1 : true : true,
                        [TicketStatuses.PENDING]: TicketStatuses.CLOSED.toString() in statuses ? TicketStatuses.PENDING.toString() in statuses[TicketStatuses.CLOSED.toString()] ? statuses[TicketStatuses.CLOSED.toString()][TicketStatuses.PENDING.toString()] === 1 : true : true,
                        [TicketStatuses.SOLVED]: TicketStatuses.CLOSED.toString() in statuses ? TicketStatuses.SOLVED.toString() in statuses[TicketStatuses.CLOSED.toString()] ? statuses[TicketStatuses.CLOSED.toString()][TicketStatuses.SOLVED.toString()] === 1 : true : true,
                        [TicketStatuses.CLOSED]: false,
                    },
                }
            } else {
                parsedStatuses = {
                    [TicketStatuses.NEW]: {
                        [TicketStatuses.NEW]: false,
                        [TicketStatuses.ASSIGN]: false,
                        [TicketStatuses.PLANNED]: false,
                        [TicketStatuses.PENDING]: false,
                        [TicketStatuses.SOLVED]: false,
                        [TicketStatuses.CLOSED]: false,
                    },
                    [TicketStatuses.ASSIGN]: {
                        [TicketStatuses.NEW]: false,
                        [TicketStatuses.ASSIGN]: false,
                        [TicketStatuses.PLANNED]: false,
                        [TicketStatuses.PENDING]: false,
                        [TicketStatuses.SOLVED]: false,
                        [TicketStatuses.CLOSED]: false,
                    },
                    [TicketStatuses.PLANNED]: {
                        [TicketStatuses.NEW]: false,
                        [TicketStatuses.ASSIGN]: false,
                        [TicketStatuses.PLANNED]: false,
                        [TicketStatuses.PENDING]: false,
                        [TicketStatuses.SOLVED]: false,
                        [TicketStatuses.CLOSED]: false,
                    },
                    [TicketStatuses.PENDING]: {
                        [TicketStatuses.NEW]: false,
                        [TicketStatuses.ASSIGN]: false,
                        [TicketStatuses.PLANNED]: false,
                        [TicketStatuses.PENDING]: false,
                        [TicketStatuses.SOLVED]: false,
                        [TicketStatuses.CLOSED]: false,
                    },
                    [TicketStatuses.SOLVED]: {
                        [TicketStatuses.NEW]: TicketStatuses.SOLVED.toString() in statuses ? TicketStatuses.NEW.toString() in statuses[TicketStatuses.SOLVED.toString()] ? statuses[TicketStatuses.SOLVED.toString()][TicketStatuses.NEW.toString()] === 1 : true : true,
                        [TicketStatuses.ASSIGN]: false,
                        [TicketStatuses.PLANNED]: false,
                        [TicketStatuses.PENDING]: false,
                        [TicketStatuses.SOLVED]: false,
                        [TicketStatuses.CLOSED]: TicketStatuses.SOLVED.toString() in statuses ? TicketStatuses.CLOSED.toString() in statuses[TicketStatuses.SOLVED.toString()] ? statuses[TicketStatuses.SOLVED.toString()][TicketStatuses.CLOSED.toString()] === 1 : true : true,
                    },
                    [TicketStatuses.CLOSED]: {
                        [TicketStatuses.NEW]: TicketStatuses.CLOSED.toString() in statuses ? TicketStatuses.NEW.toString() in statuses[TicketStatuses.CLOSED.toString()] ? statuses[TicketStatuses.CLOSED.toString()][TicketStatuses.NEW.toString()] === 1 : true : true,
                        [TicketStatuses.ASSIGN]: false,
                        [TicketStatuses.PLANNED]: false,
                        [TicketStatuses.PENDING]: false,
                        [TicketStatuses.SOLVED]: false,
                        [TicketStatuses.CLOSED]: false,
                    },
                }
            }
        }

        return parsedStatuses
    }

    async getRights() {
        await this._ParseSession()

        return {
            iface: this._interface === 'central' ? 0 : 1,
            [RightsType.TICKET]: this._ticketRights,
            [RightsType.FOLLOWUP]: this._followupRights,
            [RightsType.TASK]: this._taskRights,
            [RightsType.STATUS]: this._ticketStatusesRights,
            'agreement': this._validateRights,
        }
    }

   async getProfile() {
      await this._ParseSession()

      return {
         id: this._id,
         name: this._name,
         isSimple: this._interface !== 'central',
         [RightsType.TICKET]: this._ticketRights,
         [RightsType.FOLLOWUP]: this._followupRights,
         [RightsType.TASK]: this._taskRights,
         [RightsType.STATUS]: this._ticketStatusesRights,
         'agreement': this._validateRights,
      }
   }
}
