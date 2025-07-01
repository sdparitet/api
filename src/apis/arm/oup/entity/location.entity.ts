/* eslint-disable @typescript-eslint/no-unused-vars */
import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Oup_Group } from '~arm/oup/entity/group.entity'
import { KPI_DB_CONNECTION } from '~root/src/constants';

/**
 * @param {number} id
 * @param {string} name
 */
export interface Oup_Location_Dto {
   id: number
   name: string
}

/**
 * @param {number} id
 * @param {string} name
 */
@Entity({ database: KPI_DB_CONNECTION })
export class Oup_Location {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number;

   @Column({ type: 'varchar', unique: true })
   name: string;

   // noinspection JSUnusedLocalSymbols
   @OneToMany(
      type => Oup_Group,
      groups => groups.location,
      {
         cascade: true,
         eager: false,
      }
   )
   groups: Oup_Group[]
}
