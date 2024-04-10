import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { KPI_DB_CONNECTION } from '~root/src/constants';
import { Staff_Stat } from '~staff/entity/stat.entity';

/**
 * @param {number} id
 * @param {string} name
 * @param {boolean} read
 */
export interface Staff_Category_Dto {
   id: number
   name: string
   read: boolean
}

/**
 * @param {number} id
 * @param {string} name
 * @param {string} roleRead
 * @param {Staff_Stat[]} stats
 */
@Entity({ database: KPI_DB_CONNECTION })
export class Staff_Category {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number;

   @Column({ type: 'varchar', unique: true })
   name: string;

   @Column({ type: 'varchar', default: 'STAFF_0' })
   roleRead: string;

   // noinspection JSUnusedLocalSymbols
   @OneToMany(
      type => Staff_Stat,
      stat => stat.category,
      {
         cascade: true,
         eager: true,
      }
   )
   stats: Staff_Stat[]
}
