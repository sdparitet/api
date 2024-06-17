import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { KPI_DB_CONNECTION } from '~root/src/constants';
import { KPI_Group } from '~kpi/entity/group.entity';

/**
 * @param {number} id
 * @param {string} name
 * @param {boolean} read
 * @param {KPI_Group[]} groups
 */
export interface KPI_Category_Dto {
   id: number
   name: string
   read: boolean
   groups: KPI_Group[]
}


@Entity({ database: KPI_DB_CONNECTION })
export class KPI_Category {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number;

   @Column({ type: 'varchar', unique: true })
   name: string;

   @Column({ type: 'varchar', default: 'KPI_0' })
   roleRead: string;

   @OneToMany(
      type => KPI_Group,
      group => group.category,
      {
         cascade: true,
         eager: true,
      }
   )
   groups: KPI_Group[]
}
