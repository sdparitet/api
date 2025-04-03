import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { KPI_DB_CONNECTION } from '~root/src/constants';
import { Staff_Group } from '~staff/entity/group.entity';
import { Staff_Stat } from '~staff/entity/stat.entity';


/**
 * @param {number} id
 * @param {string} name
 * @param {Staff_Stat[]} stats
 * @param {Staff_Group} group
 */
@Entity({ database: KPI_DB_CONNECTION })
export class Staff_Position {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number;

   @Column({ type: 'varchar', nullable: false })
   name: string;

   // noinspection JSUnusedLocalSymbols
   @OneToMany(
      type => Staff_Stat,
      stats => stats.position,
      {
         cascade: true,
         orphanedRowAction: 'nullify',
      }
   )
   stats: Staff_Stat[];

   // noinspection JSUnusedLocalSymbols
   @ManyToOne(
      type => Staff_Group,
      group => group.positions,
   )
   group: Staff_Group;

   @Column({ nullable: false })
   groupId: number;
}
