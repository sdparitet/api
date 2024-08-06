import {ApiProperty} from "@nestjs/swagger";

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
