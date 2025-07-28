import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
import { Block } from '~forms/entity/block.entity'
import { FORMS_DB_CONNECTION } from '~src/constants'
import { Template } from '~forms/entity/template.entity'


@Entity({ database: FORMS_DB_CONNECTION })
export class Form {
   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number

   @Column({ type: 'varchar' })
   title: string

   @Column({ type: 'varchar', nullable: true })
   description: string

   @Column({ type: 'boolean', default: true })
   is_active: boolean

   @Column({ type: 'varchar' })
   icon: string

   @OneToMany(
      () => Block,
      block => block.form,
      {
         onDelete: 'CASCADE',
         cascade: true,
         eager: true,
      },
   )
   blocks: Block[]

   @OneToMany(
      () => Template,
      templates => templates.form,
      {
         onDelete: 'CASCADE',
         cascade: true,
         // eager: true,
      },
   )
   templates: Template[]

   @Column({ type: 'jsonb', nullable: true, default: [] })
   profiles: number[]
}
