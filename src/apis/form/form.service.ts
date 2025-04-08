/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { FORMS_DB_CONNECTION, GLPI_DB_CONNECTION } from '~root/src/constants'
import { DataSource, In, Repository } from 'typeorm'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { Response } from 'express'
import { Form } from '~form/entity/form.entity'
import { GetFormsParams, RequestGlpiSelectDto } from '~form/dto/get-request-dto'
import { AnswerDto } from '~form/dto/post-request-dto'
import { Field, FieldType } from '~form/entity/field.entity'
import { Template } from '~form/entity/template.entity'
import { CompareType, ConditionLogic, Filter, FilterCompareType, PayloadType, SingleFilter } from '~form/types'
import { GLPI } from '~root/src/connectors/glpi/glpi-api.connector'
import dayjs, { extend, ManipulateType } from 'dayjs'
import utc from 'dayjs/plugin/utc'; extend(utc);


@Injectable()
export class Form_Service {
   constructor(
      @InjectDataSource(GLPI_DB_CONNECTION) private readonly glpi: DataSource,
      @Inject(CACHE_MANAGER) private cacheService: Cache,
      @InjectRepository(Form, FORMS_DB_CONNECTION)
      private formRep: Repository<Form>,
      @InjectRepository(Field, FORMS_DB_CONNECTION)
      private fieldRep: Repository<Field>,
      @InjectRepository(Template, FORMS_DB_CONNECTION)
      private templateRep: Repository<Template>,
   ) {
   }

   //region [ Wrappers ]
   async RequestWrapper(res: Response, func: () => void) {
      try {
         func()
      } catch (err: any) {
         return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err)
      }
   }

   async GlpiApiWrapper(username: string, res: Response, func: (glpi: GLPI) => void) {
      const glpi = new GLPI(username, this.cacheService, this.glpi)
      await glpi.InitSession()

      res.setHeader('Suspend-Reauth', 'true')
      if (glpi.authorized) {
         try {
            func(glpi)
         } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err)
         }
      } else {
         return res.status(HttpStatus.UNAUTHORIZED).json({ status: 'error', message: 'Could not login in GLPI' })
      }
   }

   //endregion

   //region [ Form ]
   async GetForms(username: string, params: GetFormsParams, res: Response, id?: number) {
      const ttl = 60 * 60 * 24 * 14  // 2 недели
      await this.GlpiApiWrapper(username, res, async (glpi) => {
         if (id) {
            const cachedData: string = await this.cacheService.get(`form_${id}`)
            if (cachedData) {
               res.status(HttpStatus.OK).json(JSON.parse(cachedData))
            } else {
               const ret = (await this.formRep.find({
                  where: {
                     id: id,
                     is_active: In(params.show_inactive && params.show_inactive.toLowerCase() === 'true' ? [true, false] : [true]),
                  },
               }))

               await this.cacheService.set(`form_${id}`, JSON.stringify(ret), ttl)

               if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
               else res.status(HttpStatus.BAD_REQUEST).json([])
            }
         } else {

            let forms: Form[]

            const cachedData: string = await this.cacheService.get('forms')
            if (cachedData) {
               forms = JSON.parse(cachedData)
            } else {
               const queryBuilder = this.formRep.createQueryBuilder('form')
               .select(['form.id', 'form.title', 'form.icon', 'form.description', 'form.is_active', 'form.profiles'])
               if (params.show_inactive && params.show_inactive.toLowerCase() === 'true') {
                  queryBuilder.where('form.is_active IN (:...isActive)', { isActive: [true, false] })
               } else {
                  queryBuilder.where('form.is_active = :isActive', { isActive: true })
               }
               const ret = await queryBuilder.orderBy('id').getMany()

               await this.cacheService.set(`forms`, JSON.stringify(ret), ttl)

               forms = ret
            }

            const userInfo = await glpi.GetUserProfile()
            forms = forms.filter(form => form.profiles === null || form.profiles.length === 0 || form.profiles.includes(userInfo.profile.id))

            res.status(HttpStatus.OK).json(forms)
         }
      })
   }

   //endregion

   //region [ Form field ]
   async GetField(field_id: number) {
      return this.fieldRep.findOne({ where: { id: field_id } })
   }

   async ApplyFilter(item: object, filter: SingleFilter) {
      const { type } = filter
      const key = Object.keys(filter).find(k => !['type', 'logic', 'filters'].includes(k))
      const value = filter[key]

      switch (type) {
         case FilterCompareType.EQUAL:
            return item[key] === value
         case FilterCompareType.NOT_EQUAL:
            return item[key] !== value
         case FilterCompareType.INCLUDES:
            return value.includes(item[key])
         case FilterCompareType.NOT_INCLUDES:
            return !value.includes(item[key])
         case FilterCompareType.MORE_THEN:
            return item[key] > value
         case FilterCompareType.MORE_OR_EQUAL_THAN:
            return item[key] >= value
         case FilterCompareType.LESS_THAN:
            return item[key] < value
         case FilterCompareType.LESS_OR_EQUAL_THAN:
            return item[key] <= value
         case FilterCompareType.STARTS_WITH:
            return item[key].startsWith(value)
         case FilterCompareType.NOT_STARTS_WITH:
            return !item[key].startsWith(value)
         case FilterCompareType.ENDS_WITH:
            return item[key].endsWith(value)
         case FilterCompareType.NOT_ENDS_WITH:
            return !item[key].endsWith(value)
         default:
            return false
      }
   }

   async ApplyLogic(results: boolean[], logic: ConditionLogic) {
      switch (logic) {
         case ConditionLogic.AND:
            return results.every(Boolean)
         case ConditionLogic.OR:
            return results.some(Boolean)
         case ConditionLogic.NOT:
            return !results.every(Boolean)
         default:
            return false
      }
   }

   async FilterItem(item: object, filters: Filter[]) {
      let result: boolean = undefined

      for (const filter of filters) {
         if (filter.filters) {
            const subResults = await this.FilterItem(item, filter.filters)
            result = result === undefined ? subResults : await this.ApplyLogic([result, subResults], filter.logic)
         } else {
            const subResults = await this.ApplyFilter(item, filter as SingleFilter)
            result = result === undefined ? subResults : await this.ApplyLogic([result, subResults], filter.logic)

         }
      }

      return result
   }

   async FilterData(data: object[], filters: Filter[]) {
      const promises = data.map(async (item) => {
         const result = await this.FilterItem(item, filters)
         return { item, result }
      })

      const results = await Promise.all(promises)
      return results.filter(({ result }) => result).map(({ item }) => item)
   }

   async GetGlpiSelect(params: RequestGlpiSelectDto, res: Response) {
      if (!('username' in params) || !('field_id' in params)) {
         res.status(HttpStatus.BAD_REQUEST).json({ status: 'error', message: 'field_id or username not provided' })
      } else {
         await this.GlpiApiWrapper('portal_reader', res, async (glpi) => {
            const field = await this.GetField(params.field_id)
            const ret = await glpi.GetAllItems(field.values[0]['itemtype'] as string)

            if ('filters' in field.values[0]) {
               ret.data = await this.FilterData(ret.data, field.values[0]['filters'])
            }

            const data = ret.data.map((item: any) => ({
               value: item.id,
               label: field.values[0]['show_value_field'] ?
                  typeof field.values[0]['show_value_field'] === 'string' ?
                     item[field.values[0]['show_value_field']]
                     : field.values[0]['show_value_field'].map((key: any) => item[key]).join(' ')
                  : typeof field.values[0]['value_field'] === 'string' ?
                     item[field.values[0]['value_field']]
                     : field.values[0]['value_field'].map((key: any) => item[key]).join(' '),
            })).sort((a: {
               id: number,
               label: string
            }, b: {
               id: number,
               label: string
            }) => a.label < b.label ? -1 : 1)

            if (data && data.length > 0) res.status(ret.status).json(data)
            else res.status(HttpStatus.BAD_REQUEST).json([])
         })
      }
   }

   //endregion

   //region [ Form template ]
   async GetFormTemplates(id: number, res: Response) {
      const templates = await this.templateRep.find({
         where: { formId: id },
         relations: ['form'],
      })

      res.status(HttpStatus.OK).json(templates)
   }

   //endregion

   //region [ Answer ]
   async GlpiSelectReplacer(glpi: GLPI, fieldId: string, value: string): Promise<string> {
      const field = await this.fieldRep.findOneBy({ id: Number(fieldId) })

      let label = ''
      if (value === undefined || value === null) {
         label = 'Н/Д'
      } else {
         switch (field.type) {
            case FieldType.glpi_select: {
               const ret = await glpi.GetItem(field.values[0].itemtype.toString(), Number(value))
               label = field.values[0]['show_value_field'] ?
                  typeof field.values[0]['show_value_field'] === 'string' ?
                     ret.data[field.values[0]['show_value_field']]
                     : field.values[0]['show_value_field'].map((key: any) => ret.data[key]).join(' ')
                  : typeof field.values[0]['value_field'] === 'string' ?
                     ret.data[field.values[0]['value_field']]
                     : field.values[0]['value_field'].map((key: any) => ret.data[key]).join(' ')
               break
            }
            case FieldType.datetime:
               label = dayjs(value).utc().format('DD.MM.YYYY HH:mm')
               break
            case FieldType.date:
               label = dayjs(value).utc().format('DD.MM.YYYY')
               break
            case FieldType.time:
               label = dayjs(value).utc().format('HH:mm')
               break
            case FieldType.checkbox:
               label = ''
               break
            default:
               if (field.values === null) {
                  label = ''
               } else {
                  field.values.map(item => {
                     if (item.value.toString() === value) {
                        label = item.label
                     }
                  })
               }

         }
      }
      return label
   }

   async CheckboxReplacer(form: Form, fieldId: string, value: {[p: number|string]: boolean}): Promise<string> {
      const findField = () => {
         for (const block of Object.values(form.blocks)) {
            for (const field of block.fields) {
               if (field.id.toString() === fieldId) {
                  return field
               }
            }
         }
         return null
      }
      const field = findField()

      let label = 'Н/Д'
      if (field !== null) {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         label = field.values.filter((item: { [key: string]: any }) => value[item.value]).map((item: { [key: string]: any }) => item.label).join(', ')
      }

      return label
   }

   async TimeReplacer(minus: boolean, number: number, type: ManipulateType, readable: boolean = false) {
      const now = dayjs()
      if (minus) {
         return now.subtract(number, type).format(readable ? 'DD-MM-YYYY HH:mm:ss' : 'YYYY-MM-DDTHH:mm:ss.SSS[Z]')
      } else {
         return now.add(number, type).format(readable ? 'DD-MM-YYYY HH:mm:ss' : 'YYYY-MM-DDTHH:mm:ss.SSS[Z]')
      }
   }

   async ConditionReplacer(glpi: GLPI, source: { [p: number]: number | string | null | undefined },
                           left: string, logic: number, value: string,
                           sela: string | undefined, a: string, selb: string | undefined, b: string) {
      const leftValue = source[left]

      let result
      if (logic === 1) {
         result = leftValue === value
      } else {
         result = leftValue !== value
      }

      if (result === undefined) return 'Н/Д'

      if (result) {
         if (sela) {
            if (sela === 's') return this.GlpiSelectReplacer(glpi, a, source[a])
            else return source[a]
         } else return a
      } else {
         if (selb) {
            if (selb === 's') return this.GlpiSelectReplacer(glpi, b, source[b])
            else return source[b]
         } else return b
      }
   }

   async Answer(dto: AnswerDto, res: Response) {
      await this.GlpiApiWrapper('portal_reader', res, async (glpi) => {
         const form = await this.formRep.findOneBy({ id: dto.form_id })

         const evaluateCondition = (left: string, right: string, compareType: CompareType) => {
            switch (compareType) {
               case CompareType.EQUAL:
                  return left === right
               case CompareType.NOT_EQUAL:
                  return left !== right
               case CompareType.LESS_THAN:
                  return left < right
               case CompareType.MORE_THEN:
                  return left > right
               case CompareType.LESS_OR_EQUAL_THAN:
                  return left <= right
               case CompareType.MORE_OR_EQUAL_THAN:
                  return left >= right
            }
         }

         const validTemplates: Template[] = []
         form.templates.forEach(template => {
            if (template.conditions.length > 0) {
               let isValid = true
               template.conditions.forEach(condition => {
                  const leftValue = condition.left in dto.data ? dto.data[condition.left] : null
                  if (leftValue) {
                     const isMatch = evaluateCondition(String(leftValue), condition.right, condition.comparison_type)
                     if (!isMatch) isValid = false
                  }
               })
               if (isValid) validTemplates.push(template)
            } else {
               validTemplates.push(template)
            }
         })

         const payloads: PayloadType[] = []
         for (const template of validTemplates) {
            const payload: PayloadType = {
               // _users_id_recipient: await glpi.GetUserId(dto.username),
               _users_id_requester: await glpi.GetUserId(dto.username),
            }
            for (const key in template.data) {
               if (typeof template.data[key] === 'string') {
                  const matches = [...(template.data[key] as string).matchAll(/(?<full>##q_(?<id>\d*)##)/g)]
                  let fieldValue = template.data[key] as string
                  for (const match of matches) {
                     if (match.groups.id in dto.data) {
                        fieldValue = fieldValue.replace(match.groups.full, dto.data[match.groups.id])
                     }
                  }

                  const checkboxMatches = [...(template.data[key] as string).matchAll(/(?<full>##cb(?<column>_?[cr])?_(?<id>\d*)##)/g)]
                  for (const match of checkboxMatches) {
                     if (match.groups.id in dto.data) {
                        fieldValue = fieldValue.replace(match.groups.full, await this.CheckboxReplacer(form, match.groups.id, dto.data[match.groups.id]))
                     }
                  }

                  const glpiSelectMatches = [...(template.data[key] as string).matchAll(/(?<full>##sq_(?<id>\d*)##)/g)]
                  for (const match of glpiSelectMatches) {
                     if (match.groups.id in dto.data) {
                        fieldValue = fieldValue.replace(match.groups.full, await this.GlpiSelectReplacer(glpi, match.groups.id, dto.data[match.groups.id]))
                     }
                  }

                  const timeMatches = [...(template.data[key] as string).matchAll(/(?<full>##t_(?<minus>-?)(?<number>\d+)(?<type>[Mdhm])(?<readable>_r)?##)/g)]
                  for (const match of timeMatches) {
                     fieldValue = fieldValue.replace(match.groups.full, await this.TimeReplacer(match.groups.minus === '-', Number(match.groups.number), match.groups.type as ManipulateType, !!match.groups.readable))
                  }

                  const authorMatches = [...(template.data[key] as string).matchAll(/(?<full>##(?<sel>s_)?author##)/g)]
                  for (const match of authorMatches) {
                     const replacement = match.groups.sel
                        ? await glpi.GetUserFio(dto.username)
                        : await glpi.GetUserId(dto.username)
                     fieldValue = fieldValue.replace(match.groups.full, String(replacement))
                  }

                  const conditionMatches = [...(template.data[key] as string).matchAll(/(?<full>##cq_(?<left>\d+)\|(?<logic>[1,2])\|(?<value>[^|]+)\|(?<sela>[sv])?(?<a>\d+)\|(?<selb>[sv])?(?<b>\d+)##)/g)]
                  for (const match of conditionMatches) {
                     fieldValue = fieldValue.replace(match.groups.full, await this.ConditionReplacer(glpi, dto.data, match.groups.left, Number(match.groups.logic), match.groups.value, match.groups.sela, match.groups.a, match.groups.selb, match.groups.b))
                  }

                  payload[key] = fieldValue
               } else {
                  payload[key] = template.data[key]
               }
            }

            payloads.push(payload)
         }

         await this.GlpiApiWrapper(dto.username, res, async (_glpi: GLPI) => {
             const ret = await _glpi.AddItems('Ticket', payloads)

             if ([201, 207].includes(ret.status)) {
                 res.status(ret.status).json(ret.data)
             } else {
                 res.status(ret.status).json({ id: ret.data[0], message: ret.data[1] })
             }
         })
      })
   }

   //endregion
}
