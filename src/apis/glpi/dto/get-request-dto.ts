import {ApiProperty} from "@nestjs/swagger";

/**
 * @param {number} group_id
 * @param {string} group_name
 * @param {number} id
 * @param {string} name
 * @param {string} email
 * @param {string} phone
 * @param {string} mobile
 */
export class GetGlpiUsersInGroupsResponse {
    @ApiProperty()
    group_id: number

    @ApiProperty()
    group_name: string

    @ApiProperty()
    id: number

    @ApiProperty()
    name: string

    @ApiProperty()
    email: string

    @ApiProperty()
    phone: string
}
