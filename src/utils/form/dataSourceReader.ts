import { FieldDataEnum, IField, IFieldDataValue, SourceEnum } from '~utils/form/types'
import { GlpiApiResponse } from '~connectors/glpi/types'
import { DataSource } from 'typeorm'
import { GLPI } from '~connectors/glpi/glpi-api.connector'
import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { PORTAL_DB_CONNECTION } from '~root/src/constants'


@Injectable()
export class DataSourceReader {
   private readonly glpiDataSource: GLPI
   private source: IFieldDataValue[]

   constructor(
      // ToDo Вероятно не работает Inject
      @InjectDataSource(PORTAL_DB_CONNECTION)
      private readonly portalDataSource: DataSource,
   ) {
   }


   async get(field: IField): Promise<IFieldDataValue[]> {
      if (field?.data?.[FieldDataEnum.DATASOURCE]) {
         const datasource = field.data[FieldDataEnum.DATASOURCE]

         let result: unknown
         if (datasource.source === SourceEnum.GLPI) {
            let response: GlpiApiResponse
            if (datasource.filters) {
               response = await this.glpiDataSource.Search(datasource.item, datasource.filters)
            } else {
               response = await this.glpiDataSource.GetAllItems(datasource.item)
            }

            result = response as any  // ToDo преобразование
            // ToDo Возврат [] если не найдено ???
         } else {
            result = await this.portalDataSource.query(datasource.item)
         }
         if (result) {
            this.source = result as IFieldDataValue[]
            return result as IFieldDataValue[]
         } else return []
      } else {
         return field?.data?.[FieldDataEnum.VALUES] ?? []
      }
   }

   async find(search: string | number | (string | number)[]): Promise<(string | number)[]> {
      const sourceMap = new Map(this.source.map(item => [item.value, item.label]))
      return (Array.isArray(search) ? search : [search]).map(value => sourceMap.get(value) ?? 'Н/Д')
   }
}
