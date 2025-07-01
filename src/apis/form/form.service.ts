import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { FORMS_DB_CONNECTION, GLPI_DB_CONNECTION } from '~root/src/constants'
import { DataSource, Repository } from 'typeorm'
import { Response } from 'express'
import { Form } from '~form/entity/form.entity'
import { AnswerDto } from '~form/dto/post-request-dto'
import { Template } from '~form/entity/template.entity'
import { PayloadType } from '~form/types'
import { GLPI } from '~root/src/connectors/glpi/glpi-api.connector'
import { extend } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { ConditionCalculator } from '~utils/form/conditionCalculator'
import { TagReplacer } from '~utils/form/tagReplacer'
import { DataSourceReader } from '~utils/form/dataSourceReader'
import { IBlock, OperatorsEnum, PropertiesEnum } from '~utils/form/types'


extend(utc)


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

   async GlpiApiWrapper(username: string, res: Response, func: (glpi: GLPI) => void) {
      const glpi = new GLPI(username, this.glpi)
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

   async GetForms(username: string, res: Response, id?: number) {
      await this.GlpiApiWrapper(username, res, async (glpi) => {
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
            const forms = await this.formRep.createQueryBuilder('form')
            .select(['form.id', 'form.title', 'form.description', 'form.icon'])
            .where(`(form.profiles @> :profileId OR form.profiles IS NULL)`,
               { profileId: userProfileId })
            .orderBy({ 'form.id': 'ASC' })
            .getMany()

            if (forms.length > 0) res.status(HttpStatus.OK).json(forms)
            else res.status(HttpStatus.NOT_FOUND).json([])
         }
      })
   }

   async Answer(username: string, dto: AnswerDto, res: Response) {
      await this.GlpiApiWrapper(username, res, async (glpi) => {
         const form = await this.formRep.findOne({ where: { id: dto.form_id }, relations: ['templates'] })
         if (!form || !form.templates) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Form/templates not found' })
         }


         const validTemplates: Template[] = []
         const conditionCalculator = new ConditionCalculator(dto.data)
         form.templates.forEach(template => {
            if (template.conditions?.length > 0) {
               const isValid = conditionCalculator.validate(template.conditions)
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

            res.status(HttpStatus.OK).json(payloads)
            // await this.GlpiApiWrapper(username, res, async (_glpi: GLPI) => {
            //    const ret = await _glpi.AddItems('Ticket', payloads)
            //
            //    if ([201, 207].includes(ret.status)) {
            //       res.status(ret.status).json(ret.data)
            //    } else {
            //       res.status(ret.status).json({ id: ret.data[0], message: ret.data[1] })
            //    }
            // })
         } else res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ id: -1, message: 'Templates not found' })
      })
   }
}
