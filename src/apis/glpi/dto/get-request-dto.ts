import {ApiProperty} from "@nestjs/swagger";

/**
 * @param {number} id
 * @param {string} username
 */
export class GetImagePreviewParams {
    @ApiProperty()
    id: number

    @ApiProperty()
    username: string
}