import dayjs from 'dayjs'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'


/**
 * @param {number} id
 */
export class Oit_RemoveAccidentDto {
   constructor(model: Oit_RemoveAccidentDto) {
      this.id = model.id
   }
   readonly id: number
}

/**
 * @param {number?} id
 * @param {string} date
 * @param {number} value
 * @param {string?} comment
 * @param {number[]} groupIds
 */
export class Oit_AddAccidentDto {
   constructor(model: Partial<Oit_AddAccidentDto>) {
      this.id = model.id
      this.date = model.date || dayjs().startOf('day').toISOString()
      this.value = model.value || 0
      this.comment = model.comment
      this.groupIds = model.groupIds
   }

   @ApiProperty()
   @ApiPropertyOptional()
   readonly id?: number
   @ApiProperty()
   readonly date: string
   @ApiProperty()
   readonly value: number
   @ApiProperty()
   @ApiPropertyOptional()
   readonly comment?: string
   @ApiProperty()
   readonly groupIds: number[]
}
