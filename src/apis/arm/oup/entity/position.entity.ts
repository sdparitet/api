import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm'
import { KPI_DB_CONNECTION } from '~src/constants'
import { Oup_Stat } from '~oup/entity/stat.entity'
import { Oup_Group } from '~oup/entity/group.entity'


/**
 * @param {number} id
 * @param {string} name
 * @param {Oup_Stat[]} stats
 * @param {Oup_Group} group
 */
@Entity({ database: KPI_DB_CONNECTION })
export class Oup_Position {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number

   @Column({ type: 'varchar', nullable: false })
   name: string

   // noinspection JSUnusedLocalSymbols
   @OneToMany(
      type => Oup_Stat,
      stats => stats.position,
      {
         cascade: true,
         orphanedRowAction: 'nullify',
      },
   )
   stats: Oup_Stat[]

   // noinspection JSUnusedLocalSymbols
   @ManyToOne(
      type => Oup_Group,
      group => group.positions,
   )
   group: Oup_Group

   @Column({ nullable: false })
   groupId: number
}
