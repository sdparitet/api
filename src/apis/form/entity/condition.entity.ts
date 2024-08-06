import {
    Column,
    Entity, JoinColumn, ManyToOne, OneToOne,
    PrimaryGeneratedColumn, Unique,
} from 'typeorm';
import {FORMS_DB_CONNECTION} from '~root/src/constants';
import {Field} from "~form/entity/field.entity";
import {Block} from "~form/entity/block.entity";
import {CompareType, ConditionLogic, ShowRule} from "~form/types";


@Entity({database: FORMS_DB_CONNECTION})
@Unique('target_block_order_pk', ['target_block', 'order'])
@Unique('target_field_order_pk', ['target_field', 'order'])
export class Condition {

    @PrimaryGeneratedColumn({unsigned: true, zerofill: true})
    id: number

    @ManyToOne(
        () => Block,
        block => block.target_conditions,
        {},
    )
    target_block: Block

    @ManyToOne(
        () => Field,
        field => field.target_conditions
    )
    target_field: Field

    @ManyToOne(
        () => Field,
        field => field.source_conditions,
        {nullable: false}
    )
    @JoinColumn({name: 'source_fieldId'})
    source_field: Field

    @Column({type: 'integer', nullable: true})
    source_fieldId: number

    @OneToOne(() => Condition)
    @JoinColumn({name: 'condition_parentId'})
    condition_parent: Condition

    @Column({type: 'integer', nullable: true})
    condition_parentId: number

    @Column({type: 'integer', enum: ShowRule})
    show_rule: ShowRule

    @Column({type: 'integer', enum: CompareType, default: CompareType.EQUAL})
    condition: CompareType

    @Column({type: 'varchar', nullable: true})
    condition_value: string

    @Column({type: 'integer', enum: ConditionLogic, default: ConditionLogic.AND})
    condition_logic: ConditionLogic

    @Column({type: 'integer'})
    order: number
}
