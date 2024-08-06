import {Column, Entity, PrimaryGeneratedColumn, ManyToOne, Unique, OneToMany} from 'typeorm';
import {FORMS_DB_CONNECTION} from '~root/src/constants';
import {Block} from "~form/entity/block.entity";
import {Condition} from "~form/entity/condition.entity";


export enum FieldType {
    text = 'text',
    textarea = 'textarea',
    number = 'number',
    radio = 'radio',
    select = 'select',
    glpi_select = 'glpi_select',
    checkbox = 'checkbox',
    datetime = 'datetime',
    date = 'date',
    time = 'time',
    file = 'file',
}

@Entity({database: FORMS_DB_CONNECTION})
@Unique('order_block_pk', ['order', 'block'])
export class Field {

    @PrimaryGeneratedColumn({unsigned: true, zerofill: true})
    id: number

    @Column({type: 'varchar'})
    title: string

    @ManyToOne(
        () => Block,
        block => block.fields,
    )
    block: Block

    @Column({type: 'enum', enum: FieldType})
    type: FieldType

    @Column({type: 'boolean', default: true})
    required: boolean

    @Column({type: 'varchar', nullable: true})
    default_value: string

    @Column({type: 'jsonb', nullable: true})
    values: { [key: string]: any }[]

    @Column({type: 'integer'})
    order: number

    @Column({type: 'varchar', nullable: true})
    helper_text: string

    @OneToMany(
        () => Condition,
        condition => condition.target_field,
        {
            onDelete: 'CASCADE',
            cascade: true,
            eager: true,
        }
    )
    target_conditions: Condition[]

    @OneToMany(
        () => Condition,
        condition => condition.source_field,
        {
            onDelete: 'CASCADE',
            cascade: true,
            eager: true,
        }
    )
    source_conditions: Condition[]
}
