// import { BelongsTo, Column, DataType, ForeignKey, Model, Table, BelongsToMany } from "sequelize-typescript";
// import { KPI_KpiProduct } from './kpi-product.model';
// import { KPI_Kpi } from './kpi.model';
// import { KPI_Group } from "./group.model";
//
// interface KPIProductCreationAttrs {
//    id?: number;
//    name: string;
//    unit: string;
// }
//
// /**
//  * @param {number} id
//  * @param {string} name
//  * @param {string} unit
//  */
// @Table({ tableName: "grafana_kpi_products", name: { plural: "KPIProducts", singular: "KPIProduct" }, createdAt: false, updatedAt: false })
// export class KPI_Product extends Model<KPI_Product, KPIProductCreationAttrs> {
//
//    @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
//    id: number;
//
//    @Column({ type: DataType.STRING })
//    name: string;
//
//    @Column({ type: DataType.STRING })
//    unit: string;
//
//    // @ForeignKey(() => KPI_Kpi)
//    // kpi_id: number;
//    //
//    // @ForeignKey(() => KPI_Group)
//    // group_id: number;
//
//    @BelongsToMany(() => KPI_Kpi, () => KPI_KpiProduct)
//    kpis: KPI_Kpi[];
//
//    @BelongsTo(() => KPI_Group, 'id')
//    group: KPI_Group;
// }
//
