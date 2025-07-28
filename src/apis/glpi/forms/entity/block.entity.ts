import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, Unique, OneToMany } from 'typeorm'
import { Form } from '~forms/entity/form.entity'
import { Field } from '~forms/entity/field.entity'
import { FORMS_DB_CONNECTION } from '~src/constants'
import { PropertyConditions } from '~t_u_forms/types'


@Entity({ database: FORMS_DB_CONNECTION })
@Unique('order_form_pk', ['order', 'form'])
export class Block {
   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number

   @Column({ type: 'varchar' })
   title: string

   @Column({ type: 'integer' })
   order: number

   @ManyToOne(
      () => Form,
      form => form.blocks,
   )
   form: Form

   @OneToMany(
      () => Field,
      field => field.block,
      {
         onDelete: 'CASCADE',
         cascade: true,
         eager: true,
      },
   )
   fields: Field[]

   @Column({ type: 'jsonb', nullable: true })
   conditions: PropertyConditions | null
}
