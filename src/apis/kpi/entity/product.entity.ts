import { Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { KPI_Kpi } from '~kpi/entity/kpi.entity';
import { KPI_Group } from '~kpi/entity/group.entity';
import { KPI_DB_CONNECTION } from '~root/src/constants';


/**
 * @param {number} id
 * @param {string} name
 * @param {string} description
 * @param {KPI_Kpi[]} kpis
 * @param {KPI_Group} group
 */
@Entity( { database: KPI_DB_CONNECTION })
export class KPI_Product {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number;

   @Column({ type: 'varchar', unique: true })
   name: string;

   @Column({ type: 'varchar', nullable: true })
   description: string;

   @OneToMany(
      type => KPI_Kpi,
      kpi => kpi.product,
      {
         orphanedRowAction: 'nullify',
      }
   )
   kpis: KPI_Kpi[];

   @ManyToOne(
      type => KPI_Group,
      group => group.products,
   )
   group: KPI_Group;
}

