import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { GlpiApiResponse } from '~t_c_glpi/types'
import { GLPI } from '~c_glpi/glpi-api.connector'
import { ConditionEvaluator } from '~u_forms/conditionEvaluator'
import { GLPI_DB_CONNECTION, PORTAL_DB_CONNECTION } from '~src/constants'
import { FieldDataEnum, IField, IFieldDataValue, SourceEnum } from '~t_u_forms/types'


@Injectable()
export class DataSourceReader {
   private glpi: GLPI
   private data: IFieldDataValue[]

   constructor(
      @InjectDataSource(PORTAL_DB_CONNECTION) private readonly portalDataSource: DataSource,
      @InjectDataSource(GLPI_DB_CONNECTION) private readonly glpiDataSource: DataSource,
   ) {
      this.glpi = new GLPI('portal_reader', this.glpiDataSource)
      this.data = []
   }


   async get(field: IField): Promise<IFieldDataValue[]> {
      await this.glpi.InitSession()
      if (!this.glpi.authorized) throw new Error('GLPI authorization failed')

      if (field?.data?.[FieldDataEnum.DATASOURCE]) {
         const datasource = field.data[FieldDataEnum.DATASOURCE]

         let result: IFieldDataValue[] = []
         if (datasource.source === SourceEnum.GLPI) {
            let response: GlpiApiResponse
            if (datasource.options?.filters) {
               response = await this.glpi.Search(datasource.item, datasource.options)
            } else {
               response = await this.glpi.GetAllItems(datasource.item)
            }
            if (response.status === HttpStatus.OK) {
               result.push(...response.data.map((item: any) => {
                  let labelValue: string
                  let valueValue: any

                  if (Array.isArray(datasource.labelField)) {
                     labelValue = datasource.labelField.map(field => (item[field])).join(' ')
                  } else {
                     labelValue = item[datasource.labelField]
                  }
                  valueValue = datasource.valueField ? item[datasource.valueField] : item['2'] ?? item['id']

                  return { label: labelValue, value: valueValue }
               }))
            }
         } else {
            result = await this.portalDataSource.query(`select label, value
                                                        from ${datasource.item};`)
         }

         if (result) {
            if (datasource.options?.postFilters) {
               datasource.options.postFilters.sort((a, b )=> a.order - b.order).forEach(filter => {
                  const conditionCalculator = new ConditionEvaluator<IFieldDataValue>(
                     (data, key) => data[key],
                  )
                  result = conditionCalculator.filter(result, filter.conditions)
               })
            }

            this.data = result as IFieldDataValue[]
            return result as IFieldDataValue[]
         } else return []
      } else {
         return field?.data?.[FieldDataEnum.VALUES] ?? []
      }
   }

   async find(search: string | number | (string | number)[]): Promise<(string | number)[]> {
      const sourceMap = new Map(this.data.map(item => [item.value, item.label]))
      return (Array.isArray(search) ? search : [search]).map(value => sourceMap.get(value) ?? 'Н/Д')
   }
}
