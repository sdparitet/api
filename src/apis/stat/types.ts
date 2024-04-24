import { Moment } from 'moment';

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
