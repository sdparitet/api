/* eslint-disable @typescript-eslint/no-unused-vars */
import { Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { Oup_Location } from '~arm/oup/entity/location.entity'
import { KPI_DB_CONNECTION } from '~root/src/constants';
import { Oup_Position } from '~arm/oup/entity/position.entity';

/**
 * @param {number} id
 * @param {string} name
 * @param {boolean} read
 * @param {boolean} write
 * @param {Oup_Position[]} positions
 */
export interface Oup_Group_Dto {
   id: number
   name: string
   read: boolean
   write: boolean
   positions: Oup_Position[]
}

/**
 * @param {number} id
 * @param {string} name
 * @param {string} roleRead
 * @param {string} roleWrite
 * @param {Oup_Location} location
 * @param {Oup_Position[]} positions
 */
@Entity({ database: KPI_DB_CONNECTION })
export class Oup_Group {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number;

   @Column({ type: 'varchar', unique: true})
   name: string;

   @Column({ type: 'varchar', default: 'STAFF_0R' })
   roleRead: string;

   @Column({ type: 'varchar', default: 'STAFF_0W' })
   roleWrite: string;

   // noinspection JSUnusedLocalSymbols
   @ManyToOne(
      type => Oup_Location,
      location => location.groups,
   )
   location: Oup_Location;

   @Column({ nullable: false, default: 1 })
   locationId: number;

   // noinspection JSUnusedLocalSymbols
   @OneToMany(
      type => Oup_Position,
      position => position.group,
      {
         cascade: true,
         eager: true,
      }
   )
   positions: Oup_Position[]
}
