import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { KPI_DB_CONNECTION } from '~root/src/constants';
import { Staff_Position } from '~staff/entity/position.entity';

/**
 * @param {number} id
 * @param {string} name
 * @param {boolean} read
 * @param {boolean} write
 * @param {Staff_Position[]} positions
 */
export interface Staff_Group_Dto {
   id: number
   name: string
   read: boolean
   write: boolean
   positions: Staff_Position[]
}

/**
 * @param {number} id
 * @param {string} name
 * @param {string} roleRead
 * @param {string} roleWrite
 * @param {Staff_Position[]} positions
 */
@Entity({ database: KPI_DB_CONNECTION })
export class Staff_Group {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number;

   @Column({ type: 'varchar', unique: true})
   name: string;

   @Column({ type: 'varchar', default: 'STAFF_0R' })
   roleRead: string;

   @Column({ type: 'varchar', default: 'STAFF_0W' })
   roleWrite: string;

   // noinspection JSUnusedLocalSymbols
   @OneToMany(
      type => Staff_Position,
      position => position.group,
      {
         cascade: true,
         eager: true,
      }
   )
   positions: Staff_Position[]
}
