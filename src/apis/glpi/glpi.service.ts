import { Injectable, HttpStatus } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { Response } from 'express'
import { GLPI_DB_CONNECTION } from '~root/src/constants'
import {
   TicketChatResponse,
   TicketMembersResponse,
   RequestTicketIdAndUsernameDto,
   RequestTicketIdDto,
   UserAccessOnTicket,
   RequestUsernameDto,
   TicketFollowupDto,
   TicketsMembersResponse,
   GlpiUsersInGroupsResponse,
   UploadTicketDocumentResponse,
   RequestTicketIdAndUsernameAndStateDto,
   DeleteUserFromTicketRequest,
   GetSolutionRequest,
   GetSolutionResponse,
   GetTaskResponse,
   SetTaskStateRequest,
   CreateSolutionRequest,
   SolutionAnswerRequest,
   ChangeTicketStatusRequest,
   CreateTaskRequest,
   GetTicketsMembersRequest,
   SetAgreementStatusRequest,
   GetAgreementInfoResponse,
   CreateAgreementRequest,
   SetTicketCategoryRequest,
} from '~glpi/dto/post-request-dto'
import { GetAgreementUserParams, GetImagePreviewParams, GetImagesPreviewParams } from '~glpi/dto/get-request-dto'
import { GLPI } from '~root/src/connectors/glpi/glpi-api.connector'
import { Sharp } from 'sharp'
import sharp from 'sharp'
import * as mime from 'mime-types'
import { PayloadType } from '~connectors/glpi/types'


@Injectable()
export class GLPI_Service {
   constructor(
      @InjectDataSource(GLPI_DB_CONNECTION) private readonly glpi: DataSource,
   ) {
   }

   //region [ Wrappers ]
   async RequestWrapper(res: Response, func: () => void) {
      try {
         res.setHeader('Suspend-Reauth', 'true')
         func()
      } catch (err: any) {
         return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err)
      }
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

   // endregion

   //region [ Ticket list ]
   async GetUserTickets(dto: RequestUsernameDto, res: Response) {
      await this.GlpiApiWrapper(dto.username, res, async (glpi: GLPI) => {
         const ret = await this.glpi.query(`
            select t.id
                 , t.type
                 , t.name
                 , t.status
                 , c.completename as category
                 , t.date_creation
                 , t.time_to_resolve
            from glpi_tickets t
                    left join glpi_itilcategories c
                              on t.itilcategories_id = c.id
                    left join glpi_tickets_users u
                              on t.id = u.tickets_id
            where t.is_deleted = 0
              and u.type = 1
              and u.users_id = ${glpi.userId};`)

         if (ret) res.status(HttpStatus.OK).json(ret)
         else res.status(HttpStatus.INTERNAL_SERVER_ERROR).json([])
      })
   }

   async GetUserAssignTickets(dto: RequestUsernameDto, res: Response) {
      await this.GlpiApiWrapper(dto.username, res, async (glpi: GLPI) => {
         const ret = await this.glpi.query(`
            select t.id
                 , t.type
                 , t.name
                 , t.status
                 , c.completename as category
                 , t.date_creation
                 , t.time_to_resolve
            from glpi_tickets t
                    left join glpi_itilcategories c
                              on t.itilcategories_id = c.id
                    left join glpi_tickets_users u
                              on t.id = u.tickets_id
            where t.is_deleted = 0
              and u.type = 2
              and u.users_id = ${glpi.userId};`)

         if (ret) res.status(HttpStatus.OK).json(ret)
         else res.status(HttpStatus.BAD_REQUEST)
      })
   }

   async GetUserAgreementsTickets(dto: RequestUsernameDto, res: Response) {
      await this.GlpiApiWrapper(dto.username, res, async (glpi: GLPI) => {
         const ret = await this.glpi.query(`
            select t.id
                 , t.type
                 , t.name
                 , t.status
                 , c.completename as category
                 , t.date_creation
                 , t.time_to_resolve
                 , sub.need_agreement
            from (select tickets_id,
                         if(max(status = 2), 1, 0) as need_agreement
                  from (glpi_ticketvalidations)
                  where users_id_validate = ${glpi.userId}
                  group by tickets_id) as sub
                    left join glpi_tickets t
                              on sub.tickets_id = t.id
                    left join glpi_itilcategories c
                              on t.itilcategories_id = c.id
            where t.is_deleted = 0;`)

         if (ret) res.status(HttpStatus.OK).json(ret)
         else res.status(HttpStatus.BAD_REQUEST)
      })
   }

   async GetUserGroupsTickets(dto: RequestUsernameDto, res: Response) {
      await this.GlpiApiWrapper(dto.username, res, async (glpi: GLPI) => {
         const ret = await this.glpi.query(`
            select t.id
                 , t.type
                 , t.name
                 , t.status
                 , c.completename as category
                 , t.date_creation
                 , t.time_to_resolve
            from glpi_tickets t
                    left join glpi.glpi_itilcategories c on t.itilcategories_id = c.id
            where t.id in (select tickets_id
                           from glpi_groups_tickets
                           where groups_id in (select groups_id from glpi_groups_users where users_id = ${glpi.userId}))
              and is_deleted = 0
            order by t.id desc;`)

         if (ret) res.status(HttpStatus.OK).json(ret)
         else res.status(HttpStatus.BAD_REQUEST)
      })
   }

   async GetCultureTickets(dto: RequestUsernameDto, res: Response) {
      await this.GlpiApiWrapper(dto.username, res, async (glpi: GLPI) => {
         const ret = await this.glpi.query(`
            select t.id
                 , t.type
                 , t.name
                 , t.status
                 , c.completename as category
                 , t.date_creation
                 , t.time_to_resolve
                 , 2              as need_agreement
            from glpi_tickets t
                    left join glpi.glpi_itilcategories c on t.itilcategories_id = c.id
            where t.itilcategories_id in
                  (select id from glpi_itilcategories where completename like 'Культура производства%')
              and t.id in (select tickets_id
                           from glpi_tickets_users tu
                           where tu.users_id = ${glpi.userId}
                             and tu.type = 2)
              and is_deleted = 0
            union
            select t.id
                 , t.type
                 , t.name
                 , t.status
                 , c.completename as category
                 , t.date_creation
                 , t.time_to_resolve
                 , 3
            from glpi_tickets t
                    left join glpi.glpi_itilcategories c on t.itilcategories_id = c.id
            where t.itilcategories_id in
                  (select id from glpi_itilcategories where completename like 'Культура производства%')
              and t.id in (select tickets_id
                           from glpi_groups_tickets gt
                           where
                              gt.groups_id in (select groups_id from glpi_groups_users where users_id = ${glpi.userId})
                             and gt.type = 2)
              and is_deleted = 0
            union
            select t.id
                 , t.type
                 , t.name
                 , t.status
                 , c.completename as category
                 , t.date_creation
                 , t.time_to_resolve
                 , sub.need_agreement
            from (select tickets_id,
                         if(max(status = 2), 1, 0) as need_agreement
                  from glpi_ticketvalidations
                  where users_id_validate = ${glpi.userId}
                  group by tickets_id) as sub
                    left join glpi_tickets t
                              on sub.tickets_id = t.id
                    left join glpi_itilcategories c
                              on t.itilcategories_id = c.id
            where t.is_deleted = 0
              and t.itilcategories_id in
                  (select id from glpi_itilcategories where completename like 'Культура производства%');`)

         if (ret) res.status(HttpStatus.OK).json(ret)
         else res.status(HttpStatus.BAD_REQUEST)
      })
   }

   async GetTicketsMembers(dto: GetTicketsMembersRequest, res: Response) {
      await this.RequestWrapper(res, async () => {
         if (dto.tickets && dto.tickets.length > 0) {
            const ret: TicketsMembersResponse[] = await this.glpi.query(`
               select *
               from (select t.id                                 as ticket_id
                          , u.id
                          , CONCAT(u.realname, ' ', u.firstname) as name
                          , 1                                    as memberType
                          , tu.type                              as accessoryType
                     from glpi_tickets t
                             inner join glpi_tickets_users tu on t.id = tu.tickets_id
                             left join glpi_users u on tu.users_id = u.id
                     union
                     select t.id    as ticket_id
                          , g.id
                          , g.name
                          , 2       as memberType
                          , tg.type as accessoryType
                     from glpi_tickets t
                             inner join glpi_groups_tickets tg on t.id = tg.tickets_id
                             left join glpi_groups g on tg.groups_id = g.id) as data
               where data.ticket_id in (${dto.tickets.join(',')})`)


            if (ret) res.status(HttpStatus.OK).json(ret)
            else res.status(HttpStatus.BAD_REQUEST).json([])
         } else {
            res.status(HttpStatus.OK).json([])
         }
      })
   }

   // endregion

   //region [ Ticket info ]
   async GetProfile({ username }, res: Response) {
      await this.GlpiApiWrapper(username, res, async (glpi) => {
         const ret = await glpi.GetUserRights()
         res.status(HttpStatus.OK).json(ret)
      })
   }

   // ToDo Delete
   async GetUserAccess({ username }, res: Response) {
      await this.GlpiApiWrapper(username, res, async (glpi) => {
         const ret = await glpi.GetUserRights()
         res.status(HttpStatus.OK).json(ret)
      })
   }

   async GetUserAccessOnTicket(dto: RequestTicketIdAndUsernameDto, res: Response) {
      await this.RequestWrapper(res, async () => {
         const ret: UserAccessOnTicket[] = await this.glpi.query(`
            select if(count(id) > 0, 1, 0) as access
                 , (select if(count(id) > 0, 1, 0) from glpi_tickets where id = ${dto.id}) as found
            from glpi_tickets_users
            where tickets_id = ${dto.id}
              and type = 1
              and users_id = (select id from glpi_users where name = '${dto.username}');`)
         if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret[0])
         else res.status(HttpStatus.BAD_REQUEST).json([])
      })
   }

   async GetTicketInfo(dto: RequestTicketIdAndUsernameDto, res: Response) {
      await this.GlpiApiWrapper(dto.username, res, async (glpi) => {
         const ret = await glpi.GetItem('Ticket', dto.id, { expand_dropdowns: true })
         console.log(ret.status)
         if (ret.status >= 400) {
            res.status(ret.status).json(ret.data)
         } else {

            let category: number | string | null
            try {
               category = ret.data.itilcategories_id.replaceAll('&gt;', '>')
               // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
               if (ret.data.itilcategories_id === 0) {
                  category = null
               } else {
                  category = ret.data.itilcategories_id
               }
            }

            const data = {
               id: ret.data.id,
               name: ret.data.name,
               status: ret.data.status,
               type: ret.data.type,
               category: category,
               categoryId: +ret.data.links.find((link: {
                  rel: string,
                  href: string
               }) => link.rel === 'ITILCategory')?.href.split('/').pop() || null,
               date_creation: ret.data.date_creation,
               time_to_resolve: ret.data.time_to_resolve,
               solvedate: ret.data.solvedate,
               closedate: ret.data.closedate,
            }

            res.status(ret.status).json(data)

         }
      })
   }

   async GetTicketMembers(dto: RequestTicketIdDto, res: Response) {
      await this.RequestWrapper(res, async () => {
         const ret: TicketMembersResponse[] = await this.glpi.query(`
            select tu.tickets_id                        as ticket_id
                 , u.id
                 , u.name                               as username
                 , CONCAT(u.realname, ' ', u.firstname) as name
                 , 1                                    as memberType
                 , type                                 as accessoryType
                 , u.phone
            from glpi_tickets_users tu
                    left join glpi_users u
                              on tu.users_id = u.id
            where tickets_id = ${dto.id}
            union
            select tg.tickets_id as ticket_id
                 , g.id
                 , g.name
                 , g.name        as username
                 , 2             as memberType
                 , tg.type       as accessoryType
                 , null          as phone
            from glpi_groups_tickets tg
                    left join glpi_groups g
                              on tg.groups_id = g.id
            where tickets_id = ${dto.id};`)
         if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
         else res.status(HttpStatus.BAD_REQUEST).json([])
      })
   }

   async GetTicketChat(dto: RequestTicketIdAndUsernameDto, res: Response) {
      await this.RequestWrapper(res, async () => {
         const ret: TicketChatResponse[] = await this.glpi.query(`
            select u.id                                 as userId
                 , CONCAT(u.realname, ' ', u.firstname) as name
                 , if(u.name = '${dto.username}', 0, 1) as sideLeft
                 , f.id                                 as id
                 , 'Message'                            as type
                 , f.content                            as text
                 , f.date_creation as time
            from glpi_itilfollowups f
               left join glpi_users u
            on f.users_id = u.id
            where itemtype = 'Ticket'
              and items_id = ${dto.id}
              and is_private = 0
            union
            select u.id                                                as userId
                 , CONCAT(u.realname, ' ', u.firstname)                as name
                 , if(u.name = '${dto.username}', 0, 1)                as sideLeft
                 , d.id                                                as id
                 , if(d.mime REGEXP '^image\\\\/.*$', 'Image', 'File') as type
                 , d.filename                                          as text
                 , di.date_creation as time
            from glpi_documents_items di
               left join glpi_users u
            on di.users_id = u.id
               left join glpi_documents d on di.documents_id = d.id
            where itemtype = 'Ticket'
              and items_id = ${dto.id}
            union
            select u.id                                 as userId
                 , CONCAT(u.realname, ' ', u.firstname) as name
--                     , 1                                    as sideLeft
                 , if(u.name = '${dto.username}', 0, 1) as sideLeft
                 , s.id                                 as id
                 , 'Solution'                           as type
                 , s.content                            as text
                 , s.date_creation as time
            from glpi_itilsolutions s
               left join glpi_users u
            on s.users_id = u.id
            where s.itemtype = 'Ticket'
              and items_id = ${dto.id}
            union
            select t.users_id_recipient              as userId
                 , (select CONCAT(u.realname, ' ', u.firstname)
                    from glpi_users u
                    where id = t.users_id_recipient) as name
                 , 0                                 as sideLeft
                 , t.id                              as id
                 , 'Message'                         as type
                 , t.content                         as text
                 , t.date_creation as time
            from glpi_tickets t
            where id = ${dto.id}
            union
            select ts.users_id                          as userId
                 , CONCAT(u.realname, ' ', u.firstname) as name
                 , if(u.name = '${dto.username}', 0, 1) as sideLeft
                 , ts.id                                as id
                 , 'Task'                               as type
                 , ts.content                           as text
                 , ts.date_creation as time
            from glpi_tickettasks ts
               left join glpi_users u
            on ts.users_id = u.id
            where ts.tickets_id = ${dto.id}
            union
            select tv.users_id                          as userId
                 , CONCAT(u.realname, ' ', u.firstname) as name
                 , if(u.name = '${dto.username}', 0, 1) as sideLeft
                 , tv.id                                as id
                 , 'Agreement'                          as type
                 , tv.comment_submission                as text
                 , tv.submission_date as time
            from glpi_ticketvalidations tv
               left join glpi_users u
            on tv.users_id = u.id
            where tv.tickets_id = ${dto.id}
            order by time;`)

         if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
         else res.status(HttpStatus.BAD_REQUEST).json([])
      })
   }

   async GetSolutionTemplates(res: Response) {
      await this.GlpiApiWrapper('portal_reader', res, async (glpi) => {
         const ret = await glpi.GetAllItems('SolutionTemplate')

         const prepareData = (data: any) => {
            if (data instanceof Array) {
               return data.map((item: any) => ({
                  id: item.id,
                  name: item.name,
                  content: item.content,
               }))
            } else return data
         }

         res.status(ret.status).json(prepareData(ret.data))
      })
   }

   async GetUsers(res: Response) {
      await this.GlpiApiWrapper('portal_reader', res, async (glpi) => {
         const ret = await glpi.GetAllItems('User')
         const prepareData = ret.data.map((item: any) => ({
            id: item.id,
            label: [item.realname, item.firstname].filter(item => item !== null).join(' '),
         }))

         const filteredData = prepareData.filter((item: any) => {
            return item.label !== '' && item.label !== ' ' && ![364, 365, 328, 443, 348, 327, 374, 357, 442, 441, 380].includes(item.id)
         })

         const finalData = filteredData.sort((a: any, b: any) => a.label.localeCompare(b.label))

         res.status(ret.status).json(finalData)
      })
   }

   async GetGroups(res: Response) {
      await this.GlpiApiWrapper('portal_reader', res, async (glpi) => {
         const ret = await glpi.GetAllItems('Group')
         const prepareData = (data: any) => {
            return data.map((item: any) => ({
               id: item.id,
               label: item.completename,
            }))
         }
         res.status(ret.status).json(prepareData(ret.data))
      })
   }

   async GetSolutionInfo(dto: GetSolutionRequest, res: Response) {
      await this.RequestWrapper(res, async () => {
         const ret: GetSolutionResponse[] = await this.glpi.query(`
            select date_approval     as dateApproval,
                   users_id_approval as userIdApproval,
                   status
            from glpi_itilsolutions
            where id = ${dto.solutionId}`)

         if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret[0])
         else res.status(HttpStatus.BAD_REQUEST).json([])
      })
   }

   async CreateSolution(dto: CreateSolutionRequest, res: Response) {
      await this.GlpiApiWrapper(dto.username, res, async (glpi) => {
         const payload: PayloadType = {
            itemtype: 'Ticket',
            items_id: dto.id,
            content: dto.content,
         }
         const ret = await glpi.AddItems('ITILSolution', payload)
         res.status(ret.status).json({ ...ret.data, userId: glpi.userId, userFio: glpi.userFio })
      })
   }

   async SetSolutionAnswer(dto: SolutionAnswerRequest, res: Response) {
      await this.GlpiApiWrapper(dto.username, res, async (glpi) => {
         const payload: PayloadType = {
            id: dto.id,
            status: dto.status,
         }

         const ret = await glpi.UpdateItem('ITILSolution', payload)

         const targetTicketStatusBySolveAnswerStatus = {
            1: 6,
            2: 5,
            3: 6,
            4: 1,
         }
         await glpi.UpdateItem('Ticket', {
            id: dto.ticket_id,
            status: targetTicketStatusBySolveAnswerStatus[dto.status],
         })
         if (ret.data && ret.data.length > 0) res.status(ret.status).json({ ...ret.data[0], status: dto.status })
         else res.status(HttpStatus.INTERNAL_SERVER_ERROR).json([])
      })
   }

   async GetTaskInfo(dto: RequestTicketIdDto, res: Response) {
      await this.RequestWrapper(res, async () => {
         const ret: GetTaskResponse[] = await this.glpi.query(`
            select is_private                           as isPrivate
                 , actiontime                           as actionTime
                 , state
                 , users_id_tech                        as userIdTech
                 , CONCAT(u.realname, ' ', u.firstname) as userTech
                 , groups_id_tech                       as groupIdTech
                 , g.name                               as groupTech
            from glpi_tickettasks t
                    left join glpi_users u
                              on t.users_id_tech = u.id
                    left join glpi_groups g
                              on t.groups_id_tech = g.id
            where t.id = ${dto.id}`)


         if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret[0])
         else res.status(HttpStatus.BAD_REQUEST).json([])
      })
   }

   async SetTaskState(dto: SetTaskStateRequest, res: Response) {
      await this.GlpiApiWrapper('portal_reader', res, async (glpi) => {
         const payload: PayloadType = {
            id: dto.id,
            state: dto.state,
         }
         const { status, data } = await glpi.UpdateItem('TicketTask', payload)
         res.status(status).json(data)
      })
   }

   async ChangeTicketStatus(dto: ChangeTicketStatusRequest, res: Response) {
      await this.GlpiApiWrapper(dto.username, res, async (glpi) => {
         const payload: PayloadType = {
            id: dto.ticketId,
            status: dto.status,
         }

         const ret = await glpi.UpdateItem('Ticket', payload)
         res.status(ret.status).json(ret.data)
      })
   }

   async GetCategories(dto: RequestUsernameDto, res: Response) {
      await this.GlpiApiWrapper(dto.username, res, async (glpi) => {

         const ret = await glpi.GetAllItems('ITILCategory')

         const data: { id: number, name: string }[] = ret.data.map(category => {
            return {
               id: category.id,
               name: category.completename,
            }
         })

         res.status(ret.status).json(data.sort((a, b) => a.name.localeCompare(b.name)))
      })
   }

   async SetTicketCategory(dto: SetTicketCategoryRequest, res: Response) {
      await this.GlpiApiWrapper(dto.username, res, async (glpi) => {
         const payload: PayloadType = {
            id: dto.ticketId,
            itilcategories_id: dto.category,
         }

         const ret = await glpi.UpdateItem('Ticket', payload)
         res.status(ret.status).json(ret.data)
      })
   }

   async CreateTask(dto: CreateTaskRequest, res: Response) {
      await this.GlpiApiWrapper(dto.username, res, async (glpi) => {
         const payload: PayloadType = {
            tickets_id: dto.id,
            users_id: glpi.userId,
            users_id_tech: dto.userId,
            groups_id_tech: dto.groupId,
            content: dto.content,
            is_private: dto.isPrivate,
            state: dto.state,
         }

         const ret = await glpi.AddItems('TicketTask', payload)
         res.status(ret.status).json({ ...ret.data, userId: glpi.userId, userFio: glpi.userFio })
      })
   }

   async GetAgreementInfo(dto: RequestTicketIdDto, res: Response) {
      await this.RequestWrapper(res, async () => {
         const ret: GetAgreementInfoResponse[] = await this.glpi.query(`
            select v.users_id_validate                  as validatorId
                 , CONCAT(u.realname, ' ', u.firstname) as validator
                 , v.comment_validation                 as validationComment
                 , v.status
                 , v.validation_date                    as validationDate
            from glpi_ticketvalidations v
                    left join glpi_users u
                              on v.users_id_validate = u.id
            where v.id = ${dto.id};`)

         if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret[0])
         else res.status(HttpStatus.BAD_REQUEST).json([])
      })
   }

   async GetAgreementUser(params: GetAgreementUserParams, res: Response) {
      const incidentRights = [8192, 8208, 9216, 9232, 10240, 10256, 11264, 11280, 12288, 12304, 13312, 13328, 14336, 14352, 15360, 15376]
      const requestRights = [4096, 4112, 5120, 5136, 6144, 6160, 7168, 7184, 12288, 12304, 13312, 13328, 14336, 14352, 15360, 15376]
      await this.RequestWrapper(res, async () => {
         const ret = await this.glpi.query(`

            select *
            from (select u.id
                       , CONCAT(u.realname, ' ', u.firstname) as label
                  from glpi_users u
                  where is_deleted = 0
                    and id in (select unique users_id
                               from glpi_profiles_users
                               where profiles_id in (select profiles_id
                                                     from glpi_profilerights
                                                     where name = 'ticketvalidation'
                                                       and rights in
                                                           (${params.ticketType === 1
                                                              ? incidentRights.join(', ')
                                                              : requestRights.join(', ')})))) as dat
            where id not in (364, 365, 328, 443, 348, 327, 374, 357, 442, 441, 380)
              and label is not null;`)

         if (ret) res.status(HttpStatus.OK).json(ret)
         else res.status(HttpStatus.BAD_REQUEST).json([])
      })
   }

   async SetAgreementStatus(dto: SetAgreementStatusRequest, res: Response) {
      await this.GlpiApiWrapper(dto.username, res, async (glpi) => {
         const payload: PayloadType = {
            id: dto.id,
            status: dto.status,
            comment_validation: dto.comment,
         }

         const { status, data } = await glpi.UpdateItem('TicketValidation', payload)
         res.status(status).json(data)
      })
   }


   async CreateAgreement(dto: CreateAgreementRequest, res: Response) {
      await this.GlpiApiWrapper(dto.username, res, async (glpi) => {
         const payload: PayloadType = {
            tickets_id: dto.id,
            users_id_validate: dto.userId,
            comment_submission: dto.content,
         }

         const ret = await glpi.AddItems('TicketValidation', payload)
         res.status(ret.status).json({ ...ret.data, userId: glpi.userId, userFio: glpi.userFio })
      })
   }


   async DeleteUserFromTicket(dto: DeleteUserFromTicketRequest, res: Response) {
      await this.GlpiApiWrapper('portal_reader', res, async (glpi) => {
         const ret = await this.glpi.query(`
            select id
            from glpi_tickets_users
            where tickets_id = ${dto.ticket_id}
              and users_id = ${dto.user_id}
              and type = ${dto.accessoryType};`)

         if (!ret || ret.length === 0) res.status(HttpStatus.BAD_REQUEST).json([])
         else {
            const payload = [{ id: ret[0].id }]
            await glpi.DeleteItems('Ticket_User', payload)
            res.status(HttpStatus.OK).json([])
         }
      })
   }

   async GetUserInfoByUsername(params: RequestUsernameDto, res: Response) {
      await this.GlpiApiWrapper(params.username, res, (glpi) => {
         const data = {
            id: glpi.sessionInfo.session.glpiID,
            name: glpi.sessionInfo.session.glpifriendlyname,
         }

         if (data) res.status(HttpStatus.OK).json(data)
         else res.status(HttpStatus.BAD_REQUEST).json([])
      })
   }

   async AddUsersInTicket(dto: DeleteUserFromTicketRequest[], res: Response) {
      await this.GlpiApiWrapper('portal_reader', res, async (glpi) => {
         const payload: PayloadType[] = dto.map(user => ({
            tickets_id: user.ticket_id,
            users_id: user.user_id,
            type: user.accessoryType,
         }))

         const { status, data } = await glpi.AddItems('Ticket_User', payload)

         res.status(status).json(data)
      })
   }

   // endregion

   // region [ Phonebook ]
   async GetGlpiUsersInGroups(res: Response) {
      await this.RequestWrapper(res, async () => {
         const ret: GlpiUsersInGroupsResponse[] = await this.glpi.query(`
            select u.groups_id                          as group_id
                 , g.name                               as group_name
                 , u.id
                 , CONCAT(u.realname, ' ', u.firstname) as name
                 , um.email
                 , u.phone
            from glpi_users u
                    left join glpi_useremails um
                              on u.id = um.users_id
                    left join glpi_groups g
                              on u.groups_id = g.id
            where um.is_default = 1
              and u.groups_id <> 0
            order by g.name, name;`)
         if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
         else res.status(HttpStatus.BAD_REQUEST).json([])
      })
   }

   // endregion

   //region [ GLPI API ]
   async CreateTicketFollowup(dto: TicketFollowupDto, res: Response) {
      await this.GlpiApiWrapper(dto.username, res, async (glpi) => {
         const ret = await glpi.CreateFollowup(dto.ticket_id, dto.text)

         res.status(ret.status).json({
            id: ret.data.id,
            message: ret.data.message,
            userId: glpi.userId,
            userFio: glpi.userFio,
         })
      })
   }

   async SwitchTicketNotifications(dto: RequestTicketIdAndUsernameAndStateDto, res: Response) {
      await this.GlpiApiWrapper(dto.username, res, async (glpi) => {
         const ret = await glpi.SwitchTicketNotification(dto.id, dto.state)

         if (ret) res.status(ret.status).json(ret.data)
         else res.status(HttpStatus.BAD_REQUEST).json([])
      })
   }

   async UploadTicketDocument(files: Express.Multer.File[], dto: RequestTicketIdAndUsernameDto, res: Response) {
      if (files && files.length > 0) {
         const processedFiles = await Promise.all(
            files.map(async (file) => {
               const mimeType = mime.lookup(file.originalname)

               if (mimeType && mimeType.startsWith('image/')) {
                  const rotatedBuffer = await sharp(file.buffer)
                  .rotate()
                  .toBuffer()
                  return { ...file, buffer: rotatedBuffer }
               } else {
                  return file
               }
            }),
         )

         await this.GlpiApiWrapper('portal_reader', res, async (glpi) => {
            const ret: UploadTicketDocumentResponse = await glpi.UploadTicketDocument(processedFiles, dto.id, dto.username)
            if (ret.status !== HttpStatus.CREATED) {
               console.log(`UploadTicketDocument error\nTicket:${dto.id}\nStatus:${ret.status}\nData: ${ret.data}`)
            }
            res.status(ret.status).json({ id: ret.data[0].id, userId: glpi.userId, userFio: glpi.userFio })
         })
      } else {
         res.status(HttpStatus.BAD_REQUEST).json({ status: 'error', message: 'File not provided' })
      }
   }

   async DownloadDocument(dto: RequestTicketIdAndUsernameDto, res: Response) {
      let filename = 'unknown.file'

      const _ret = await this.glpi.query(`select filename
                                          from glpi_documents
                                          where id = '${dto.id}';`)
      if (_ret) {
         filename = _ret[0].filename
      }
      await this.GlpiApiWrapper(dto.username, res, async (glpi) => {
         const ret = await glpi.DownloadDocument(dto.id)

         res.set('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`)
         res.set('Content-Type', 'application/octet-stream')
         res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
         res.set('Content-Length', ret.data.length.toString())

         res.status(ret.status).send(ret.data)
      })
   }

   async CompressImage(image: Sharp) {
      const maxWidth = 480
      const maxHeight = 400
      const maxRelation = 20

      const meta = await image.metadata()
      const isHorizontal = meta.width > meta.height
      if ((Math.max(meta.width, meta.height) / Math.min(meta.width, meta.height)) > maxRelation) {
         return null
      } else {
         if (isHorizontal) {
            if (meta.width > maxWidth) {
               return image.resize(maxWidth, Math.round(meta.height * maxWidth / meta.width)).toBuffer()
            } else {
               return image.toBuffer()
            }
         } else {
            if (meta.height > maxHeight) {
               return image.resize(Math.round(meta.width * maxHeight / meta.height), maxHeight).toBuffer()
            } else {
               return image.toBuffer()
            }
         }
      }
   }

   async GetImagePreview(params: GetImagePreviewParams, res: Response) {
      let filename = 'unknown.file'

      const _ret = await this.glpi.query(`select filename
                                          from glpi_documents
                                          where id = '${params.id}';`)
      if (_ret) {
         filename = _ret[0].filename
      }
      await this.GlpiApiWrapper(params.username, res, async (glpi) => {
         const ret = await glpi.DownloadDocument(params.id)
         if (ret.status === HttpStatus.OK) {
            if (ret.mime === undefined) {
               res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                  status: 'error',
                  message: 'File mime type not provided',
               })
            } else {
               if (ret.mime.split('/').length > 0 && ret.mime.split('/')[0] === 'image') {
                  const image = sharp(Buffer.from(ret.data, 'base64'))
                  const compressedImageBuffer: Buffer | null = await this.CompressImage(image)

                  if (compressedImageBuffer !== null) {
                     const compressedImage = sharp(compressedImageBuffer)
                     const compressedMeta = await compressedImage.metadata()
                     const bufferData = await compressedImage.toBuffer()
                     res.status(ret.status).json({
                        id: params.id,
                        asFile: false,
                        fileName: filename,
                        fileSize: ret.data.length,
                        fileWidth: compressedMeta.width,
                        fileHeight: compressedMeta.height,
                        base64: bufferData.toString('base64'),
                     })

                  } else {
                     res.status(ret.status).json({
                        id: params.id,
                        asFile: true,
                        fileName: filename,
                        fileSize: ret.data.length,
                        fileWidth: 0,
                        fileHeight: 0,
                        base64: '',
                     })
                  }
               } else {
                  res.status(ret.status).json({
                     id: params.id,
                     asFile: true,
                     fileName: filename,
                     fileSize: ret.data.length,
                     fileWidth: 0,
                     fileHeight: 0,
                     base64: '',
                  })
               }
            }
         } else {
            res.status(ret.status).json([])
         }
      })

   }

   async GetImagesPreview(params: GetImagesPreviewParams, res: Response) {
      await this.GlpiApiWrapper(params.username, res, async (glpi) => {
         const ids = params.id.split(',').map(Number)
         if (ids.length > 0) {
            const data = []
            for (const id of ids) {
               let filename = 'unknown.file'
               const _ret = await this.glpi.query(`select filename
                                                   from glpi_documents
                                                   where id = '${id}';`)
               if (_ret) {
                  filename = _ret[0].filename
               }

               const ret = await glpi.DownloadDocument(id)
               if (ret.status === HttpStatus.OK) {
                  const image = sharp(Buffer.from(ret.data, 'base64'))
                  const meta = await image.metadata()
                  const buffer = await image.toBuffer()
                  data.push({
                     id: id,
                     asFile: false,
                     fileName: filename,
                     fileSize: ret.data.length,
                     fileWidth: meta.width,
                     fileHeight: meta.height,
                     base64: buffer.toString('base64'),
                  })
               }
            }
            res.status(HttpStatus.OK).json(data)
         }
      })
   }

   //endregion
}
