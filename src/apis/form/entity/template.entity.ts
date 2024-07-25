import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique} from 'typeorm';
import {FORMS_DB_CONNECTION} from '~root/src/constants';
import {Form} from "~form/entity/form.entity";
import {TemplateCondition} from "~form/entity/template.conditions.entity";


@Entity({database: FORMS_DB_CONNECTION})
export class Template {

    @PrimaryGeneratedColumn({unsigned: true, zerofill: true})
    id: number

    @ManyToOne(
        () => Form,
        form => form.templates,
    )
    form: Form

    @Column({type: 'jsonb'})
    data: { [key: string]: string | number }

    @OneToMany(
        () => TemplateCondition,
        condition => condition.template,
        {
            onDelete: 'CASCADE',
            cascade: true,
            eager: true,
        }
    )
    conditions: TemplateCondition[]
}
