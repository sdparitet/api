import {Column, Entity, PrimaryGeneratedColumn, OneToMany} from 'typeorm';
import {FORMS_DB_CONNECTION} from '~root/src/constants';
import {Block} from "~form/entity/block.entity";
import {Template} from "~form/entity/template.entity";


@Entity({database: FORMS_DB_CONNECTION})
export class Form {

    @PrimaryGeneratedColumn({unsigned: true, zerofill: true})
    id: number

    @Column({type: 'varchar'})
    title: string

    @Column({type: 'varchar'})
    icon: string

    @Column({type: 'varchar', nullable: true})
    description: string

    @Column({type: 'boolean', default: true})
    is_active: boolean

    @OneToMany(
        () => Block,
        block => block.form,
        {
            onDelete: 'CASCADE',
            cascade: true,
            eager: true,
        }
    )
    blocks: Block[]

    @OneToMany(
        () => Template,
        templates => templates.form,
        {
            onDelete: 'CASCADE',
            cascade: true,
            eager: true,
        }
    )
    templates: Template[]
}
