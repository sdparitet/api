import { Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm';
import { KPI_Kpi } from '~kpi/entity/kpi.entity';
import { KPI_Group } from '~kpi/entity/group.entity';


/**
 * @param {number} id
 * @param {string} name
 * @param {string} unit
 * @param {KPI_Kpi[]} kpis
 * @param {KPI_Group} group
 */
@Entity()
export class KPI_Product {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number;

   @Column({ type: 'varchar', unique: true })
   name: string;

   @Column({ type: 'varchar' })
   unit: string;

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

