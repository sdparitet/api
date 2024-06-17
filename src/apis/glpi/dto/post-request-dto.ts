import { ApiProperty } from '@nestjs/swagger';

/**
 * @param {string} name
 */
export class IGetUserTicketsRequestDto {
   @ApiProperty()
   name: string
}

/**
 * @param {string} name
 */
export class IGetUsersInTicketsByAuthorRequestDto extends IGetUserTicketsRequestDto {}


/**
 * @param {number} id
 * @param {number} type
 * @param {string} name
 * @param {string} category
 * @param {string} date_creation
 * @param {string} date_solve
 * @param {string} date_mod
 */
export class IGetUserTicketsResponse {
   @ApiProperty()
   id: number

   @ApiProperty()
   type: number

   @ApiProperty()
   name: string

   @ApiProperty()
   category: string

   @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
   date_creation: string

   @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
   date_solve: string

   @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
   date_mod: string
}


/**
 * @param {number} ticket_id
 * @param {string} name
 * @param {number} type
 */
export class IGetUsersInTicketsByAuthorRequestResponse {
   @ApiProperty()
   ticket_id: number

   @ApiProperty()
   name: string

   @ApiProperty()
   type: number
}
