// import { Column, DataType, Model, Table, HasMany, HasOne } from "sequelize-typescript";
// import { KPI_Product } from './product.model';
//
// interface KPIGroupCreationAttrs {
//    id: number;
//    name: string;
// }
//
// /**
//  * @param {number} id
//  * @param {string} name
//  * @param {KPIProduct[]} products
//  */
// @Table({ tableName: "grafana_kpi_groups", name: { plural: "KPIGroups", singular: "KPIGroup" }, createdAt: false, updatedAt: false })
// export class KPI_Group extends Model<KPI_Group, KPIGroupCreationAttrs> {
//
//    @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
//    id: number;
//
//    @Column({ type: DataType.STRING, unique: true, primaryKey: true })
//    name: string;
//
//    @HasOne(() => KPI_Product, 'id')
//    products: KPI_Product[]
// }
