/* eslint-disable @typescript-eslint/no-unused-vars */
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { KPI_DB_CONNECTION } from '~root/src/constants';
import { Oup_Position } from '~arm/oup/entity/position.entity';
import { Oup_Category } from '~arm/oup/entity/category.entity';


/**
 * @param {number} id
 * @param {number} year
 * @param {number} month
 * @param {number} value
 * @param {Oup_Position} product
 * @param {Oup_Category} category
 */
@Entity({ database: KPI_DB_CONNECTION })
@Unique('oup_cat_position_year_month.kp', ['category', 'position', 'year', 'month'])
export class Oup_Stat {

   @PrimaryGeneratedColumn({ unsigned: true, zerofill: true })
   id: number;

   @Column({ type: 'int', nullable: false })
   year: number;

   @Column({ type: 'int', nullable: false })
   month: number;

   @Column({ type: 'float', default: 0, nullable: true })
   value: number;

   // noinspection JSUnusedLocalSymbols
   @ManyToOne(
      type => Oup_Position,
      product => product.stats,
      {
         onDelete: 'CASCADE',
         orphanedRowAction: 'nullify',
      }
   )
   @JoinColumn()
   position: Oup_Position;
   @Column({ nullable: false })
   positionId: number;

   // noinspection JSUnusedLocalSymbols
   @ManyToOne(
      type => Oup_Category,
      category => category.stats,
   )
   category: Oup_Category;

   @Column({ nullable: false })
   categoryId: number;
}
