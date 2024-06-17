import { Column, Entity, UpdateDateColumn } from 'typeorm';
import { STAT_DB_CONNECTION } from '~root/src/constants';


/**
 * @param {number} id
 * @param {number} status
 * @param {number} reaction
 * @param {number} solution
 * @param {number} cost
 * @param {number} last_log
 * @param {string} last_update
 */
@Entity( 'stat_glpi_tickets',{ database: STAT_DB_CONNECTION } )
export class Stat_Ticket {

   @Column({ type: 'int', primary: true, unique: true, nullable: false, default: 0 })
   id: number;

   @Column({ type: 'int', nullable: false, default: 0 })
   status: number;

   @Column({ type: 'bigint', nullable: false, default: 0 })
   reaction: number;

   @Column({ type: 'bigint', nullable: false, default: 0 })
   solution: number;

   @Column({ type: 'float', nullable: false, default: 0 })
   cost: number;

   @Column({ type: 'bigint', nullable: false, default: 0 })
   last_log: number;

   @UpdateDateColumn({ type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
   last_update: string;
}
