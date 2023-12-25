import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { KPIGroup } from './kpi-group.model';

interface KPIProductCreationAttrs {
   name: string;
   unit: string;
   group_id: number;
}

/**
 * @param {number} id
 * @param {string} name
 * @param {string} unit
 * @param {number} group_id
 * @param {KPIGroup} group
 */
@Table({ tableName: "grafana_kpi_products", name: { plural: "KPIProducts", singular: "KPIProduct" }, createdAt: false, updatedAt: false })
export class KPIProduct extends Model<KPIProduct, KPIProductCreationAttrs> {

   @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
   id: number;

   @Column({ type: DataType.STRING, unique: true, primaryKey: true })
   name: string;

   @Column({ type: DataType.STRING, allowNull: false })
   unit: string;

   @ForeignKey(() => KPIGroup)
   @Column({ type: DataType.INTEGER, allowNull: false })
   group_id: number;

   @BelongsTo(() => KPIGroup, "group_id")
   group: KPIGroup;
}

