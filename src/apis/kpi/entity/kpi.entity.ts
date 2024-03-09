import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { KPI_Product } from '~kpi/entity/product.entity';
import { KPI_DB_CONNECTION } from '~root/src/constants';


/**
 * @param {number} id
 * @param {string} date
 * @param {number} value
 * @param {KPI_Product} product
 */
@Entity({ database: KPI_DB_CONNECTION })
@Unique('kpi_kp', ['date', 'product'])
export class KPI_Kpi {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number;

   @Column({ type: 'date', nullable: false })
   date: string;

   @Column({ type: 'float', default: 0, nullable: true })
   value: number;

   @ManyToOne(
      type => KPI_Product,
      product => product.kpis
   )
   @JoinColumn()
   product: KPI_Product;
}
