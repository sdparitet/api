import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Unique,
    OneToMany, BeforeInsert,
} from 'typeorm';
import {FORMS_DB_CONNECTION} from '~root/src/constants';
import {Form} from "~form/entity/form.entity";
import {Field} from "~form/entity/field.entity";
import {Condition} from "~form/entity/condition.entity";

/**
 * @param {number} id
 * @param {string} title
 * @param {number} order
 * @param {Form} form
 * @param {Field[]} fields
 */
export interface IBlock_Dto {
    id: number
    title: string
    order: number
    form: Form
    fields: Field[]
}

@Entity({database: FORMS_DB_CONNECTION})
@Unique('order_form_pk', ['order', 'form'])
export class Block {

    @PrimaryGeneratedColumn({unsigned: true, zerofill: true})
    id: number

    @Column({type: 'varchar'})
    title: string

    @Column({type: 'integer'})
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
        }
    )
    fields: Field[]

    @OneToMany(
        () => Condition,
        condition => condition.target_block,
        {
            onDelete: 'CASCADE',
            cascade: true,
            eager: true,
        }
    )
    target_conditions: Condition[]
}
