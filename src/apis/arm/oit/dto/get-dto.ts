import dayjs from 'dayjs'
import { ApiProperty } from '@nestjs/swagger'

/**
 * @param {number[]} groupIds
 * @param {string} dateAfter
 * @param {string} dateBefore
 */
export class OIT_GetAccidentsDto {
   constructor(model: Partial<OIT_GetAccidentsDto>) {
      this.groupIds = model.groupIds || []
      this.dateAfter = model.dateAfter || dayjs().startOf('year').toISOString()
      this.dateBefore = model.dateBefore || dayjs().endOf('week').toISOString()
   }
   @ApiProperty()
   readonly groupIds: number[];
   @ApiProperty()
   readonly dateAfter: string;
   @ApiProperty()
   readonly dateBefore: string;
}
