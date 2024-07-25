import {Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique} from 'typeorm';
import {FORMS_DB_CONNECTION} from '~root/src/constants';
import {Template} from "~form/entity/template.entity";
import {CompareType, ConditionLogic} from "~form/types";


@Entity({database: FORMS_DB_CONNECTION})
@Unique('template_order_pk', ['template', 'order'])
export class TemplateCondition {
    @PrimaryGeneratedColumn({unsigned: true, zerofill: true})
    id: number

    @ManyToOne(
        () => Template,
        template => template.conditions,
    )
    template: Template

    @Column({type: 'varchar'})
    left: string

    @Column({type:'varchar'})
    right: string

    @Column({type: 'integer', enum: CompareType, default: CompareType.EQUAL})
    comparison_type: CompareType

    @Column({type: 'integer'})
    order: number

    @Column({type: 'varchar', enum: ConditionLogic, default: ConditionLogic.AND})
    condition_logic: ConditionLogic
}