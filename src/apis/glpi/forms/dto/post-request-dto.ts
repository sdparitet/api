import { ApiProperty } from '@nestjs/swagger'
import { IsNumber } from 'class-validator'
import { Type } from 'class-transformer'


/**
 * @param {number} form_id
 * @param { [key: number]: number | string | number[] | string[] | null | undefined } data
 */
export class AnswerDto {
   @ApiProperty()
   @Type(() => Number)
   @IsNumber()
   formId: number

   @ApiProperty()
   data: { [key: number]: number | string | number[] | string[] | null | undefined }
}


/**
 * @param {number} formId
 * @param {number} ticketId
 * @param {Express.Multer.File[]} files
 */
export class AnswerFilesDto {
   @ApiProperty()
   @Type(() => Number)
   @IsNumber()
   formId: number

   @ApiProperty()
   @Type(() => Number)
   @IsNumber()
   ticketId: number

   @ApiProperty({ type: 'string', format: 'binary', isArray: true })
   files?: Express.Multer.File[]
}
