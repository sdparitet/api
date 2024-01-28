// import { BelongsTo, Column, DataType, ForeignKey, Model, Table, BelongsToMany } from "sequelize-typescript";
// import { KPI_Kpi } from "~kpi/kpi.model";
// import { KPI_Product } from './product.model';
//
//
// @Table({ tableName: "grafana_kpi_kpi_products", createdAt: false, updatedAt: false })
// export class KPI_KpiProduct extends Model<KPI_KpiProduct> {
//
//    @Column({ type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true })
//    id: number;
//
//    @ForeignKey(() => KPI_Kpi)
//    @Column({ type: DataType.INTEGER})
//    kpi_id: number;
//
//    @ForeignKey(() => KPI_Product)
//    @Column({ type: DataType.INTEGER})
//    product_id: number;
// }
