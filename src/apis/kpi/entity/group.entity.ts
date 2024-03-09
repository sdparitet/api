import { Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, Unique } from 'typeorm';
import { KPI_Product } from '~kpi/entity/product.entity';
import { KPI_DB_CONNECTION } from '~root/src/constants';
import { KPI_Category } from '~kpi/entity/category.entity';

/**
 * @param {number} id
 * @param {string} name
 * @param {boolean} read
 * @param {boolean} write
 * @param {KPI_Product[]} products
 * @param {KPI_Category} category
 */
export interface KPI_Group_Dto {
   id: number
   name: string
   read: boolean
   write: boolean
   products: KPI_Product[]
   category: KPI_Category
}


@Entity({ database: KPI_DB_CONNECTION })
@Unique('group_cat_pk', ['name', 'category'])
export class KPI_Group {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number;

   @Column({ type: 'varchar'})
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

   @ManyToOne(
      type => KPI_Category,
      category => category.groups,
   )
   category: KPI_Category;
}
