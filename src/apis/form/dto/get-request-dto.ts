import {ApiProperty} from "@nestjs/swagger";

/**
 * @param {string} name
 * @param {string} value_field
 */
export class RequestGlpiSelectDto {
    @ApiProperty()
    username: string

    @ApiProperty()
    field_id: number
}

/**
 * @param {string} show_inactive
 */
export class GetFormsParams {
    @ApiProperty()
    show_inactive?: string
}

/**
 * @param {number} block_id
 * @param {field_id} block_id
 */
export class GetConditionParams {
    @ApiProperty()
    block_id?: number

    @ApiProperty()
    field_id?: number
}