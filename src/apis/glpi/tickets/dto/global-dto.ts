import { ApiProperty } from '@nestjs/swagger'


/**
 * @param {number} id
 */
export class IdDto {
   @ApiProperty()
   id: number
}

/**
 * @param {number[]} ids
 */
export class IdsDto {
   @ApiProperty()
   ids: number[]
}
