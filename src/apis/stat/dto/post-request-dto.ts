/**
 * @param {'string' | 'number' | 'boolean'} type
 * @param {string} field
 * @param {string[] | number[] | boolean} values
 */
export interface IRequestFilter {
   type: 'string' | 'number' | 'boolean'
   field: string
   values: string[] | number[] | boolean
}

/**
 * @param {IRequestFilter[]} filters
 * @param {boolean} isDeleted
 * @param {number} pageNum
 * @param {number} pageSize
 */
export class Stat_RequestTicketDto {
   constructor(model: Stat_RequestTicketDto) {
      this.filters = model.filters || []
      this.isDeleted = model.isDeleted || false
      this.pageNum = model.pageNum || -1
      this.pageSize = model.pageSize || 100
   }

   readonly filters: IRequestFilter[];
   readonly isDeleted: boolean;
   readonly pageNum: number;
   readonly pageSize: number;
}
