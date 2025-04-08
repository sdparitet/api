/* eslint-disable @typescript-eslint/no-unused-vars */
import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { KPI_DB_CONNECTION } from '~root/src/constants';
import { Oit_Accident } from '~arm/oit/entity/accident.entity'

/**
 * @param {number} id
 * @param {string} name
 * @param {string} path
 * @param {boolean} read
 * @param {boolean} write
 * @param {Oit_Accident[]} accidents
 */
export interface Oit_Group_Dto {
   id: number
   name: string
   path: string
   read: boolean
   write: boolean
   accidents: Oit_Accident[]
}

/**
 * @param {number} id
 * @param {string} name
 * @param {string} path
 * @param {Oit_Accident[]} accidents
 * @param {string} roleRead
 * @param {string} roleWrite
 */
@Entity({ database: KPI_DB_CONNECTION })
export class Oit_Group {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number;

   @Column({ type: 'varchar', nullable: false })
   name: string;

   @Column({ type: 'varchar', unique: true })
   path: string;

   @Column({ type: 'varchar', default: 'OIT_0R' })
   roleRead: string;

   @Column({ type: 'varchar', default: 'OIT_0W' })
   roleWrite: string;

   // noinspection JSUnusedLocalSymbols
   @OneToMany(
      type => Oit_Accident,
      accident => accident.group,
      {
         cascade: true,
         eager: true,
      }
   )
   accidents: Oit_Accident[]
}
