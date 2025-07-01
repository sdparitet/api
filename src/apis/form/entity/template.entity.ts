import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { FORMS_DB_CONNECTION } from '~root/src/constants'
import { Form } from '~form/entity/form.entity'
import { ICondition, IConditionGroup } from '~utils/form/types'


@Entity({ database: FORMS_DB_CONNECTION })
export class Template {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number

   @ManyToOne(
      () => Form,
      form => form.templates,
   )
   @JoinColumn({ name: 'formId' })
   form: Form

   @Column({ type: 'integer' })
   formId: number

   @Column({ type: 'jsonb' })
   data: { [key: string]: string | number }

   @Column({ type: 'jsonb', nullable: true })
   conditions: (ICondition | IConditionGroup)[]
}
