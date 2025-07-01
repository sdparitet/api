import { ApiProperty } from '@nestjs/swagger'


/**
 * @param {string} name
 * @param {string} value_field
 */
export class RequestGlpiSelectDto {
   @ApiProperty()
   username: string

   @ApiProperty()
   fieldId: number
}
