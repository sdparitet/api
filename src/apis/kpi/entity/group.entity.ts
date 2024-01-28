import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { KPI_Product } from '~kpi/entity/product.entity';



/**
 * @param {number} id
 * @param {string} name
 * @param {string} role
 * @param {KPI_Product[]} products
 */
@Entity()
export class KPI_Group {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number;

   @Column({ type: 'varchar', unique: true })
   name: string;

   @Column({ type: 'varchar', default: 'KPI_0' })
   role: string;

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
