import { Template } from '~form/entity/template.entity'
import { AnswerType, IField, IForm, OperatorsEnum } from '~utils/form/types'
import { GLPI } from '~connectors/glpi/glpi-api.connector'
import dayjs, { ManipulateType } from 'dayjs'
import { PayloadType } from '~form/types'
import { DataSourceReader } from '~utils/form/dataSourceReader'
import { Inject, Injectable } from '@nestjs/common'


enum TagTypeEnum {
   CHECKBOX = 'c',
   TIME = 't',
   AUTHOR = 'a',
   CONDITION = 'ca',
}


@Injectable()
export class TagReplacer {
   private readonly glpiDataSource: GLPI
   private form: IForm
   private data: AnswerType
   private payload: PayloadType = {}
   private readonly validTimeUnits = ['m', 'h', 'd', 'w', 'M', 'Q', 'y']

   constructor(
      @Inject()
      private readonly dataSourceReader: DataSourceReader,
   ) {
   }

   private async findField(fieldId: number): Promise<undefined | IField> {
      if (isNaN(fieldId)) return undefined
      for (const block of this.form.blocks) {
         const field = block.fields.find(f => f.id === fieldId)
         if (field) return field
      }
      return undefined
   }

   private async _replace(sourceText: string, matches: RegExpExecArray[]): Promise<string> {
      let replacedText = sourceText
      for (const match of matches) {
         let textToReplace: string | number = 'Н/Д'
         const tagType = TagTypeEnum[match.groups.tag]  // Required
         const fieldId = match.groups.id  // Optional
         const useDataSource = !!match.groups.ds  // Optional
         const field = await this.findField(Number(fieldId))  // Possibly undefined

         const answerValue = this.data[match.groups.id]
         void await this.dataSourceReader.get(field)
         switch (tagType) {
            case TagTypeEnum.CHECKBOX: {
               const labels = await this.dataSourceReader.find(answerValue)
               const asColumn = !!match.groups.column
               textToReplace = asColumn
                  ? '<ul><li>' + labels.join('</li><li>') + '</li></ul>'
                  : labels.toString()
               break
            }
            case TagTypeEnum.TIME: {
               const minus = !!match.groups.minus
               const count = match.groups.count
               const unit = match.groups.unit
               const asReadable = !!match.groups.readable
               const shorter = !!match.groups.shorter
               const now = dayjs()
               if (!count || !unit || !this.validTimeUnits.includes(unit)) break
               if (minus) {
                  textToReplace = now.subtract(Number(count), unit as ManipulateType).format(asReadable
                     ? shorter
                        ? 'DD-MM-YYYY'
                        : 'DD-MM-YYYY HH:mm'
                     : 'YYYY-MM-DDTHH:mm:ss.SSS[Z]')
               } else {
                  textToReplace = now.add(Number(count), unit as ManipulateType).format(asReadable
                     ? shorter
                        ? 'DD-MM-YYYY'
                        : 'DD-MM-YYYY HH:mm'
                     : 'YYYY-MM-DDTHH:mm:ss.SSS[Z]')
               }
               break
            }
            case TagTypeEnum.AUTHOR: {
               const asReadable = !!match.groups.readable
               textToReplace = asReadable ? this.glpiDataSource.userFio : this.glpiDataSource.userId
               break
            }
            // ToDo Проверить блок CONDITION
            case TagTypeEnum.CONDITION: {
               const { left, operator, right, trueValue, falseValue } = match.groups
               const trueAsReadable = !!match.groups.trueReadable
               const falseAsReadable = !!match.groups.falseReadable
               if (left && operator && right && trueValue && falseValue) {
                  let result = true
                  switch (operator) {
                     case OperatorsEnum.EQ: {
                        result = String(this.data[left]) === right
                        break
                     }
                     case OperatorsEnum.NEQ: {
                        result = String(this.data[left]) === right
                        break
                     }
                     // Note Здесь можно добавить больше сравнений
                  }

                  let _field: IField | undefined

                  if (result) {
                     if (!trueAsReadable) {
                        textToReplace = String(this.data[trueValue])
                        break
                     }
                     _field = await this.findField(Number(trueValue))
                  } else {
                     if (!falseAsReadable) {
                        textToReplace = String(this.data[falseValue])
                        break
                     }
                     _field = await this.findField(Number(falseValue))
                  }
                  if (!_field) break

                  const labels = await this.dataSourceReader.find(result ? trueValue : falseValue)
                  textToReplace = labels.length > 1 ? labels.join(', ') : labels[0]
               }
               break
            }
            default: {
               if (!answerValue) break
               if (useDataSource) {
                  const labels = await this.dataSourceReader.find(answerValue)
                  textToReplace = labels.length > 1 ? labels.join(', ') : labels[0]
               } else textToReplace = answerValue.toString()
               break
            }
         }

         replacedText = replacedText.replace(match.groups.full, String(textToReplace))
      }
      return replacedText
   }

   async replace(form: IForm, data: AnswerType, template: Template): Promise<PayloadType> {
      this.form = form
      this.data = data
      const templateData = template.data
      for (const [key, value] of Object.entries(templateData)) {
         if (typeof value === 'string') {
            let text = value

            const questionMatches = [...value.matchAll(/(?<full>##q_(?<id>\d*)##)/g)]
            if (questionMatches.length) text = await this._replace(text, questionMatches)

            const timeMatches = [...value.matchAll(/(?<full>##t_(?<minus>-?)(?<number>\d+)(?<type>[Mdhm])(?<readable>_r)?##)/g)]
            if (timeMatches.length) text = await this._replace(text, timeMatches)

            const checkboxMatches = [...value.matchAll(/(?<full>##cb(?<column>_?[cr])?_(?<id>\d*)##)/g)]
            if (checkboxMatches.length) text = await this._replace(text, checkboxMatches)

            const authorMatches = [...value.matchAll(/(?<full>##(?<sel>s_)?author##)/g)]
            if (authorMatches.length) text = await this._replace(text, authorMatches)

            const conditionMatches = [...value.matchAll(/(?<full>##cq_(?<left>\d+)\|(?<logic>[1,2])\|(?<value>[^|]+)\|(?<sela>[sv])?(?<a>\d+)\|(?<selb>[sv])?(?<b>\d+)##)/g)]
            if (conditionMatches.length) text = await this._replace(text, conditionMatches)

            this.payload[key] = text
         } else this.payload[key] = value
      }

      return this.payload
   }
}







