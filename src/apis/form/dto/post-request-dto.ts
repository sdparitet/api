import {ApiProperty} from "@nestjs/swagger";
import {CompareType, ConditionLogic} from "~form/types";

/**
 * @param {string} title
 * @param {string} descrription
 * @param {boolean} is_active
 */
export class CreateFormDto {
    @ApiProperty()
    title: string

    @ApiProperty()
    description?: string

    @ApiProperty()
    is_active?: boolean
}

export interface GlpiSelect {
    id: number
    name: string
}

/**
 * @param {number} target_block_id
 * @param {number} target_field_id
 * @param {number} source_block_id
 * @param {number} source_field_id
 * @param {CompareType} condition
 * @param {string} condition_value
 * @param {ConditionLogic} condition_logic
 * @param {number} order
 */
export class CreateConditionDto {
    @ApiProperty()
    target_block_id?: number

    @ApiProperty()
    target_field_id?: number

    @ApiProperty()
    source_block_id?: number

    @ApiProperty()
    source_field_id?: number

    @ApiProperty()
    condition?: CompareType

    @ApiProperty()
    condition_value?: string

    @ApiProperty()
    condition_logic?: ConditionLogic

    @ApiProperty()
    order?: number

}

/**
 * @param {number} form_id
 * @param {{ [key: number]: number | string | null | undefined }} data
 */
export class AnswerDto {
    @ApiProperty()
    username: string

    @ApiProperty()
    form_id: number

    @ApiProperty()
    data: { [key: number]: number | string | null | undefined }
}
