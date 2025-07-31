import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { HttpStatus, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { Response } from 'express'
import utc from 'dayjs/plugin/utc'
import dayjs from 'dayjs'
import { PayloadType } from '~t_forms/types'
import { Form } from '~forms/entity/form.entity'
import { GLPI } from '~c_glpi/glpi-api.connector'
import { TagReplacer } from '~u_forms/tagReplacer'
import { Template } from '~forms/entity/template.entity'
import { GlpiWrapper } from '~c_glpi/request-wrappers'
import { DataSourceReader } from '~u_forms/dataSourceReader'
import { ConditionEvaluator } from '~u_forms/conditionEvaluator'
import { AnswerDto, AnswerFilesDto } from '~forms/dto/post-request-dto'
import { FORMS_DB_CONNECTION, GLPI_DB_CONNECTION } from '~src/constants'
import { AnswerType } from '~t_u_forms/types'


dayjs.extend(utc)


@Injectable()
export class Form_Service {
   constructor(
      @InjectDataSource(GLPI_DB_CONNECTION) private readonly glpi: DataSource,
      @InjectRepository(Form, FORMS_DB_CONNECTION)
      private formRep: Repository<Form>,
      private readonly dataSourceReader: DataSourceReader,
      private readonly tagReplacer: TagReplacer,
   ) {
   }


   async GetForms(username: string, res: Response, id?: number) {
      await GlpiWrapper(username, res, this.glpi, async (glpi) => {
         const userProfileId = glpi.sessionInfo.session.glpiactiveprofile.id
         if (id) {
            const form = await this.formRep.findOne({
               select: {
                  id: true,
                  title: true,
                  description: true,
                  blocks: true,
                  profiles: true,
                  templates: false,
               },
               where: {
                  id: id,
                  is_active: true,
               },
            })

            if (form) {
               if (form.profiles === null || form.profiles.includes(userProfileId)) {
                  for (const block of form.blocks) {
                     for (const field of block.fields) {
                        if (field.data?.datasource) {
                           field.data.values = await this.dataSourceReader.get(field)
                        }
                     }
                  }
                  res.status(HttpStatus.OK).json(form)
               } else res.status(HttpStatus.FORBIDDEN).json({})
            } else res.status(HttpStatus.NOT_FOUND).json({})
         } else {
            const forms = await this.formRep.createQueryBuilder('forms')
            .select(['forms.id', 'forms.title', 'forms.description', 'forms.icon'])
            .where(`(forms.profiles @> :profileId OR forms.profiles IS NULL) AND forms.is_active = true`,
               { profileId: userProfileId })
            .orderBy({ 'forms.id': 'ASC' })
            .getMany()

            console.log(forms.length)


            if (forms.length > 0) res.status(HttpStatus.OK).json(forms)
            else res.status(HttpStatus.NOT_FOUND).json([])
         }
      })
   }

   async Answer(username: string, dto: AnswerDto, res: Response) {
      await GlpiWrapper(username, res, this.glpi, async (glpi) => {
         const form = await this.formRep.findOne({ where: { id: dto.formId }, relations: ['templates'] })
         if (!form || !form.templates) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Form/templates not found' })
         }

         const validTemplates: Template[] = []
         const conditionCalculator = new ConditionEvaluator<AnswerType>(
            (data, key) => data[key],
         )
         form.templates.forEach(template => {
            if (template.conditions?.length > 0) {
               const isValid = conditionCalculator.validate(dto.data, template.conditions)
               if (isValid) validTemplates.push(template)
            } else {
               validTemplates.push(template)
            }
         })

         if (validTemplates.length > 0) {
            const payloads: PayloadType[] = []
            for (const template of validTemplates) {
               const replacedTemplate = await this.tagReplacer.replace(form, dto.data, template)
               replacedTemplate['_users_id_recipient'] = glpi.userId
               replacedTemplate['_users_id_requester'] = glpi.userId
               payloads.push(replacedTemplate)
            }

            const ret = await glpi.AddItems('Ticket', payloads)

            if ([201, 207].includes(ret.status)) {
               res.status(ret.status).json(ret.data)
            } else {
               res.status(ret.status).json({ id: ret.data[0], message: ret.data[1] })
            }
         } else res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ id: -1, message: 'Templates not found' })
      })
   }

   async AnswerFiles(username: string, dto: AnswerFilesDto, files: Express.Multer.File[], res: Response) {
      if (!dto.formId) return res.status(HttpStatus.BAD_REQUEST).json('Не указан номер формы')
      if (!dto.ticketId) return res.status(HttpStatus.BAD_REQUEST).json('Не указан номер заявки')
      if (!files || files?.length === 0) return res.status(HttpStatus.BAD_REQUEST).json('Не переданы файлы')

      const form = await this.formRep.findOne({ where: { id: dto.formId } })
      if (!form) {
         return res.status(HttpStatus.BAD_REQUEST).json('Форма не найдена')
      }


      await GlpiWrapper(username, res, this.glpi, async (glpi) => {
         const ret = await glpi.UploadTicketDocument(files, dto.ticketId)
         console.log(ret)
         res.status(ret.status).json({ id: ret.data[0].id })
      })
   }
}
