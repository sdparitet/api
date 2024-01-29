import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { KPI_Product } from '~kpi/entity/product.entity';

/**
 * @param {number} id
 * @param {string} name
 * @param {boolean} read
 * @param {boolean} write
 * @param {KPI_Product[]} products
 */
export interface KPI_Group_Dto {
   id: number
   name: string
   read: boolean
   write: boolean
   products: KPI_Product[]
}

/**
 * @param {number} id
 * @param {string} name
 * @param {string} roleRead
 * @param {string} roleWrite
 * @param {KPI_Product[]} products
 */
@Entity()
export class KPI_Group {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number;

   @Column({ type: 'varchar', unique: true })
   name: string;

   @Column({ type: 'varchar', default: 'KPI_0' })
   roleRead: string;

   @Column({ type: 'varchar', default: 'KPI_0' })
   roleWrite: string;

   @OneToMany(
      type => KPI_Product,
      product => product.group,
      {
         cascade: true,
         eager: true,
      }
   )
   products: KPI_Product[]
}
