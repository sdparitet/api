import { BelongsToMany, Column, DataType, Model, Table, HasMany, ForeignKey } from "sequelize-typescript";
import { KPIProduct } from './kpi-product.model';

interface KPIGroupCreationAttrs {
   id: number;
   name: string;
   products: KPIProduct[];
}

/**
 * @param {number} id
 * @param {string} name
 * @param {KPIProduct[]} products
 */
@Table({ tableName: "grafana_kpi_groups", name: { plural: "KPIGroups", singular: "KPIGroup" }, createdAt: false, updatedAt: false })
export class KPIGroup extends Model<KPIGroup, KPIGroupCreationAttrs> {

   @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
   id: number;

   @Column({ type: DataType.STRING, unique: true, primaryKey: true })
   name: string;

   @HasMany(() => KPIProduct)
   products: KPIProduct[] = []
}
