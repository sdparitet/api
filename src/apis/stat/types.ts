
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
