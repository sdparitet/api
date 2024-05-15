import { Moment } from 'moment';
import { Stat_Ticket } from '~stat/entity/ticket.entity';

/**
 * @param {number} ticket_id
 * @param {string} l_date
 * @param {number} l_type
 * @param {string} old_value
 * @param {string} new_value
 * @param {number} entities_id
 * @param {string} name
 * @param {string} date_creation
 * @param {string} date
 * @param {string} closedate
 * @param {string} solvedate
 * @param {number} status
 * @param {number} type
 */
export interface ILogData {
   ticket_id: number,
   l_date: string,
   l_type: number,
   old_value: string,
   new_value: string,
   entities_id: number,
   name: string,
   date_creation: string
   date: string,
   closedate: string,
   solvedate: string,
   status: number,
   type: number,
}

/**
 * @param {number} lId
 * @param {number} tId
 * @param {Moment} tCreate
 * @param {Moment} tSolve
 * @param {Moment} tClose
 * @param {number} action
 * @param {number} aId
 * @param {string} aName
 * @param {Moment} date
 * @param {number | null} fot
 * @param {number | null} oValId
 * @param {string | null} oValName
 * @param {number | null} nValId
 * @param {string | null} nValName
 */
export interface IShortLogData {
   lId: number
   tId: number
   tCreate: Moment
   tSolve: Moment
   tClose: Moment
   action: number
   aId: number
   aName: string
   date: Moment
   fot: number | null
   oValId: number | null
   oValName: string | null
   nValId: number | null
   nValName: string | null
}

/**
 * @param {number} id
 * @param {string} name
 * @param {string} fio
 * @param {number} fot
 */
export interface IUserShortData {
   id: number
   name: string
   fio: string
   fot: number
}

/**
 * @param {number} id
 * @param {number} fot
 * @param {number} i
 * @param {number} ticket_id
 */
export interface IUserLog {
   id: number,
   fot: number,
   i: number,
   ticket_id: number,
}

/**
 * @param {number} id
 * @param {number} fot
 * @param {number} i
 * @param {string} ticket_id
 * @param {string | null} start
 * @param {string | null} end
 */
export interface IUserLogDto extends IUserLog {
   start: string | null,
   end: string | null,
}

/**
 * @param {number} id
 * @param {number} fot
 * @param {string} ticket_id
 * @param {Moment | null} start
 * @param {Moment | null} end
 */
export interface IUserLogData extends IUserLog {
   start: Moment | null,
   end: Moment | null,
}

/**
 * @param {number} id
 * @param {number} fot
 * @param {number} i
 * @param {string} ticket_id
 * @param {Moment} start
 * @param {Moment} end
 */
export interface IUserLogDataNormalized extends IUserLog {
   start: Moment,
   end: Moment,
}

/**
 * @param {number} tId
 * @param {number} status
 * @param {number} reaction
 * @param {number} solution
 * @param {number} cost
 * @param {number} last_log
 * @param {Record<number, Stat_UserRecord>} user
 */
export interface Stat_TicketDto extends Omit<Stat_Ticket, 'id' | 'last_update'> {
   tId: number,
   status: number,
   reaction: number,
   solution: number,
   cost: number,
   last_log: number,
   user: Record<string, Stat_UserRecord>
}

/**
 * @param {number} tUId
 * @param {boolean} active
 * @param {number} fot
 * @param {Stat_UserRecordTimers[]} timers
 */
export interface Stat_UserRecord {
   tUId: number
   isActive: boolean
   fot: number
   timers: Stat_UserRecordTimers[]
}

/**
 * @param {Moment} tStart
 * @param {Moment} tStop
 */
export interface Stat_UserRecordTimers {
   tStart: Moment
   tStop: Moment
}
