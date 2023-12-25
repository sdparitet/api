import { Column, DataType, ForeignKey, Model, Table, BelongsTo } from "sequelize-typescript";
import { KPIProduct } from './kpi-product.model';

interface KPICreationAttrs {
   id?: number;
   date: string;
   product_id: number;
   value: number;
}

/**
 * @param {number} id
 * @param {string} date
 * @param {number} product_id
 * @param {KPIProduct} product
 * @param {number} value
 * @param {string} unit
 */
@Table({ tableName: "grafana_kpis", name: { plural: "KPI's", singular: "KPI" }, createdAt: false, updatedAt: true })
export class KPI extends Model<KPI, KPICreationAttrs> {

   @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
   id: number;

   @Column({ type: DataType.DATEONLY, allowNull: false })
   date: string;

   @ForeignKey(() => KPIProduct)
   @Column({ type: DataType.INTEGER, allowNull: false })
   product_id: number;

   @BelongsTo(() => KPIProduct, "product_id")
   product: KPIProduct;

   @Column({ type: DataType.INTEGER, allowNull: true })
   value: number;
}
