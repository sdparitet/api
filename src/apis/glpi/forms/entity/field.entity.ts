import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, Unique } from 'typeorm'
import { Block } from '~forms/entity/block.entity'
import { FORMS_DB_CONNECTION } from '~src/constants'
import { FieldTypeEnum, IFieldData, PropertyConditions } from '~t_u_forms/types'


@Entity({ database: FORMS_DB_CONNECTION })
@Unique('order_block_pk', ['order', 'block'])
export class Field {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number

   @Column({ type: 'varchar' })
   title: string

   @Column({ type: 'varchar', nullable: true })
   description: string

   @ManyToOne(
      () => Block,
      block => block.fields,
   )
   block: Block

   @Column({ type: 'enum', enum: FieldTypeEnum })
   type: FieldTypeEnum

   @Column({ type: 'integer' })
   order: number

   @Column({ type: 'boolean', default: true })
   required: boolean

   @Column({ type: 'varchar', nullable: true })
   default_value: string

   @Column({ type: 'jsonb', nullable: true })
   data: IFieldData

   @Column({ type: 'jsonb', nullable: true })
   conditions: PropertyConditions | null
}
