import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { STAT_DB_CONNECTION } from '~root/src/constants';


/**
 * @param {number} id
 * @param {number} ticket_id
 * @param {number} ticket_status
 * @param {number} reaction
 * @param {number} solution
 * @param {number} cost
 * @param {string} last_update
 */
@Entity( 'ticket',{ database: STAT_DB_CONNECTION } )
export class Stat_Ticket {

   @PrimaryGeneratedColumn({ unsigned: true })
   id: number;

   @Column({ type: 'int', unique: true, nullable: false, default: 0 })
   ticket_id: number;

   @Column({ type: 'int', nullable: false, default: 0 })
   ticket_status: number;

   @Column({ type: 'bigint', nullable: false, default: 0 })
   reaction: number;

   @Column({ type: 'bigint', nullable: false, default: 0 })
   solution: number;

   @Column({ type: 'float', nullable: false, default: 0 })
   cost: number;

   @UpdateDateColumn({ type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
   last_update: string;
}
