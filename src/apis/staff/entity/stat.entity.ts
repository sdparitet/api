import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { KPI_DB_CONNECTION } from '~root/src/constants';
import { Staff_Position } from '~staff/entity/position.entity';
import { Staff_Category } from '~staff/entity/category.entity';


/**
 * @param {number} id
 * @param {number} year
 * @param {number} month
 * @param {number} value
 * @param {Staff_Position} product
 * @param {Staff_Category} category
 */
@Entity({ database: KPI_DB_CONNECTION })
@Unique('cat_position_year_month.kp', ['category', 'position', 'year', 'month'])
export class Staff_Stat {

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
      type => Staff_Position,
      product => product.stats
   )
   @JoinColumn()
   position: Staff_Position;
   @Column({ nullable: false })
   positionId: number;

   // noinspection JSUnusedLocalSymbols
   @ManyToOne(
      type => Staff_Category,
      category => category.stats,
   )
   category: Staff_Category;
   @Column({ nullable: false })
   categoryId: number;
}
