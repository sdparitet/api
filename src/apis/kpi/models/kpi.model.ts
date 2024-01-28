// // import { Column, DataType, ForeignKey, Model, Table, BelongsTo, HasOne } from "sequelize-typescript";
// import { KPI_Product } from './product.model';
//
// interface KPICreationAttrs {
//    id?: number;
//    date: string;
//    value: number;
//    product_id: number
// }
//
// /**
//  * @param {number} id
//  * @param {string} date
//  * @param {number} value
//  * @param {number} product_id
//  * @param {KPI_Product} product
//  * @param {string} unit
//  */
// @Table({ tableName: "grafana_kpis", name: { plural: "KPI's", singular: "KPI" }, createdAt: false, updatedAt: true })
// export class KPI_Kpi extends Model<KPI_Kpi, KPICreationAttrs> {
//
//    @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
//    id: number;
//
//    @Column({ type: DataType.DATEONLY, allowNull: false })
//    date: string;
//
//    @Column({ type: DataType.INTEGER, allowNull: true })
//    value: number;
//
//    @HasOne(() => KPI_Product, 'id')
//    product: KPI_Product;
// }
// // @Table({ tableName: "grafana_kpis", name: { plural: "KPI's", singular: "KPI" }, createdAt: false, updatedAt: true })
// // export class KPI_Kpi extends Model<KPI_Kpi, KPICreationAttrs> {
// //
// //    @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
// //    id: number;
// //
// //    @Column({ type: DataType.DATEONLY, allowNull: false })
// //    date: string;
// //
// //    @Column({ type: DataType.INTEGER, allowNull: true })
// //    value: number;
// //
// //    @HasOne(() => KPI_Product, 'id')
// //    product: KPI_Product;
// // }
