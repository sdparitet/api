import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger'
import { KPI_DB_CONNECTION } from '~root/src/constants';
import { Oit_Group } from '~arm/oit/entity/group.entity'


/**
 * @param {number} id
 * @param {string} date
 * @param {number} value
 * @param {string} comment
 * @param {Oit_Group} group
 * @param {number} groupId
 */
@Entity({ database: KPI_DB_CONNECTION })
@Unique('oup_group_date_accident.kp', ['group', 'date'])
export class Oit_Accident {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number;

   @Column({ type: 'timestamptz', nullable: false })
   date: string;

   @Column({ type: 'float', nullable: true, default: 0 })
   value: number;

   @Column({ type: 'text', nullable: false, default: '' })
   comment: string;

   // noinspection JSUnusedLocalSymbols
   @ManyToOne(
      type => Oit_Group,
      group => group.accidents,
      {
         onDelete: 'CASCADE',
         orphanedRowAction: 'nullify',
      }
   )
   @JoinColumn()
   @ApiHideProperty()
   group: Oit_Group;
   @Column({ nullable: false })
   groupId: number;
}
