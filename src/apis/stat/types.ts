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
 * @param {string} name
 * @param {string} full_name
 * @param {string} ticket_id
 */
export interface IUserLog {
   id: number,
   fot: number,
   name: string,
   full_name: string,
   ticket_id: number,
}

/**
 * @param {number} id
 * @param {number} fot
 * @param {string} name
 * @param {string} full_name
 * @param {string} ticket_id
 * @param {string} start
 * @param {string} end
 */
export interface IUserLogDto extends IUserLog {
   start: string,
   end: string,
}

/**
 * @param {number} id
 * @param {number} fot
 * @param {string} name
 * @param {string} full_name
 * @param {string} ticket_id
 * @param {Moment} start
 * @param {Moment} end
 */
export interface IUserLogData extends IUserLog {
   start: Moment,
   end: Moment,
}
