import { Stat_ALLTicket } from '~stat/entity/all_ticket.entity';

export interface IUserData {
   userId: number
   userName: string
   userGuid: string
   userRoles: string[]
}

/**
 * @param {number} pageNum
 * @param {number} pageSize
 * @param {number} total
 * @param {Stat_ALLTicket[]} data
 */
export interface ITicketDto {
   pageNum: number
   pageSize: number
   total: number
   data: Stat_ALLTicket[]
}
