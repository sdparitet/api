import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { GLPI_DB_CONNECTION } from '~src/constants'
import { DataSource } from 'typeorm'
import { Response } from 'express'
import { GlpiWrapper } from '~c_glpi/request-wrappers'
import { GLPI } from '~c_glpi/glpi-api.connector'
import { GetTicketsMembersRequestDto } from '~tickets/dto/post-request-dto'
import { ISearch } from '~t_c_glpi/types'
import {
   defaultTicketListCriteria,
   defaultTicketListFields,
   keyMap, Ticket,
   TicketFieldEnum,
} from '~t_tickets/ticket-model'


@Injectable()
export class ListTicketService {
   constructor(
      @InjectDataSource(GLPI_DB_CONNECTION) private readonly glpi: DataSource,
   ) {
   }
   async GetGlpiSession(username: string, res: Response) {
      await GlpiWrapper(username, res, this.glpi, async (glpi: GLPI) => {
         res.status(HttpStatus.OK).json(glpi.sessionInfo)
      })
   }


   async ParseGroupsIdFromRawData(rawData: unknown[], field: number) {
      return Object.fromEntries(rawData.map(data => [data['id'], data[`Ticket_${field}`]?.['0']?.['id'] ?? null]))
   }

   async GetTicketList(glpi: GLPI, criteria: ISearch, res: Response) {
      const ret = await glpi.Search('Ticket', criteria)
      if (ret && ret.status === HttpStatus.OK) {
         const data = ret.data && Array.isArray(ret.data) ? ret.data : []

         const membersId = {
            requesters: {},
            specialists: {},
            watchers: {},
         }
         if (criteria.rawdata && data) {
            const rawData = ret.rawData && Array.isArray(ret.rawData) ? ret.rawData : []
            membersId.requesters = criteria.forcedisplay.includes(TicketFieldEnum.groupRequester) ? await this.ParseGroupsIdFromRawData(rawData, 71) : {}
            membersId.specialists = criteria.forcedisplay.includes(TicketFieldEnum.groupSpecialists) ? await this.ParseGroupsIdFromRawData(rawData, 8) : {}
            membersId.watchers = criteria.forcedisplay.includes(TicketFieldEnum.groupWatchers) ? await this.ParseGroupsIdFromRawData(rawData, 65) : {}
         }

         const formatedTickets = data.map(ticket => ({
            ...ticket,
            '4': Array.isArray(ticket['4']) ? ticket['4'] : [ticket['4']],
            '5': Array.isArray(ticket['5']) ? ticket['5'] : [ticket['5']],
            '66': Array.isArray(ticket['66']) ? ticket['66'] : [ticket['66']],
            '71': membersId.requesters[ticket['2']] ? [membersId.requesters[ticket['2']]] : null,
            '8': membersId.specialists[ticket['2']] ? [membersId.specialists[ticket['2']]] : null,
            '65': membersId.watchers[ticket['2']] ? [membersId.watchers[ticket['2']]] : null,
         }))

         const tickets = keyMap(formatedTickets)
         res.status(HttpStatus.OK).json(tickets)
      } else res.status(HttpStatus.INTERNAL_SERVER_ERROR).json([])
   }

   async GetUserTickets(username: string, fields: (keyof typeof TicketFieldEnum)[] | undefined = [], res: Response) {
      await GlpiWrapper(username, res, this.glpi, async (glpi: GLPI) => {
         const criteria: ISearch = {
            ...defaultTicketListCriteria,
            rawdata: true,
            forcedisplay: [
               ...defaultTicketListFields,
               TicketFieldEnum.groupSpecialists,
               ...Array.from(new Set(fields
               .filter(field => field in TicketFieldEnum)
               .map(field => TicketFieldEnum[field]))),
            ],

            filters: [{
               field: TicketFieldEnum.requesters,
               searchtype: 'equals',
               value: glpi.userId,
            }],
         }


         await this.GetTicketList(glpi, criteria, res)
      })
   }

   async GetUserAssignTickets(username: string, fields: (keyof typeof TicketFieldEnum)[] | undefined = [], res: Response) {
      await GlpiWrapper(username, res, this.glpi, async (glpi: GLPI) => {
         const criteria: ISearch = {
            ...defaultTicketListCriteria,
            rawdata: true,
            forcedisplay: [
               ...defaultTicketListFields,
               ...Array.from(new Set(fields
               .filter(field => field in TicketFieldEnum)
               .map(field => TicketFieldEnum[field]))),
            ],

            filters: [{
               field: TicketFieldEnum.specialists,
               searchtype: 'equals',
               value: glpi.userId,
            }],
         }
         await this.GetTicketList(glpi, criteria, res)
      })
   }

   async GetUserGroupsTickets(username: string, fields: (keyof typeof TicketFieldEnum)[] | undefined = [], res: Response) {

      await GlpiWrapper(username, res, this.glpi, async (glpi: GLPI) => {
         const criteria: ISearch = {
            ...defaultTicketListCriteria,
            rawdata: true,
            forcedisplay: [
               ...defaultTicketListFields,
               ...Array.from(new Set(fields
               .filter(field => field in TicketFieldEnum)
               .map(field => TicketFieldEnum[field]))),
            ],

            filters: glpi.sessionInfo.session.glpigroups.map(group => ({
               link: 'OR',
               field: TicketFieldEnum.groupSpecialists,
               searchtype: 'equals',
               value: group,
            })),
         }

         await this.GetTicketList(glpi, criteria, res)
      })
   }

   async GetUserAgreementsTickets(username: string, fields: (keyof typeof TicketFieldEnum)[] | undefined = [], res: Response) {
      await GlpiWrapper(username, res, this.glpi, async (glpi: GLPI) => {
         const criteria: ISearch = {
            ...defaultTicketListCriteria,
            rawdata: true,
            forcedisplay: [
               ...defaultTicketListFields,
               TicketFieldEnum.validationGlobalStatus,
               TicketFieldEnum.validationStatus,
               ...Array.from(new Set(fields
               .filter(field => field in TicketFieldEnum)
               .map(field => TicketFieldEnum[field]))),
            ],

            filters: [
               {
                  field: TicketFieldEnum.validationValidator,
                  searchtype: 'equals',
                  value: glpi.userId,
               },
            ],
         }
         await this.GetTicketList(glpi, criteria, res)
      })
   }

   async GetCultureTickets(username: string, fields: (keyof typeof TicketFieldEnum)[] | undefined = [], res: Response) {
      await GlpiWrapper(username, res, this.glpi, async (glpi: GLPI) => {
         const criteria: ISearch = {
            ...defaultTicketListCriteria,
            rawdata: true,
            forcedisplay: [
               ...defaultTicketListFields,
               ...Array.from(new Set(fields
               .filter(field => field in TicketFieldEnum)
               .map(field => TicketFieldEnum[field]))),
            ],

            filters: [
               {
                  link: 'AND',
                  field: TicketFieldEnum.category,
                  searchtype: 'under',
                  value: 260,  // ID Категории "Культура производства"
               },
               {
                  link: 'AND',
                  criteria: [
                     {
                        link: 'OR',
                        field: TicketFieldEnum.specialists,
                        searchtype: 'equals',
                        value: glpi.userId,
                     },
                     ...glpi.sessionInfo.session.glpigroups.map(group => ({
                        link: 'OR' as const,
                        field: TicketFieldEnum.groupSpecialists,
                        searchtype: 'equals' as const,
                        value: group,
                     })),
                  ],
               },

            ],
         }

         await this.GetTicketList(glpi, criteria, res)
      })
   }

   async GetTicketsMembers(username: string, dto: GetTicketsMembersRequestDto, res: Response) {
      await GlpiWrapper(username, res, this.glpi, async (glpi: GLPI) => {
         if (dto.groups.length === 0 && dto.users.length === 0) {
            res.status(HttpStatus.BAD_REQUEST).json({ status: 'error', 'message': 'users or groups required' })
            return
         }

         let users = {}
         let groups = {}

         if (dto.users.length > 0) {
            const usersCriteria: ISearch = {
               get_hateoas: false,
               forcedisplay: [
                  // id, username, realname, firstname,
                  1,    // username
                  2,    // id
                  34,   // realname
                  9,    // firstname
                  81,   // ???
               ],
               filters: dto.users.map(id => ({
                  link: 'OR',
                  field: 2,
                  searchtype: 'equals',
                  value: id,
               })),

            }

            const usersRet = await glpi.Search('User', usersCriteria)

            if (usersRet.status === HttpStatus.OK && usersRet.data && Array.isArray(usersRet.data)) {
               usersRet.data.forEach(user => {
                  users[user['2']] = {
                     username: user['1'],
                     name: `${user['34']}${user['9'] !== '' ? ' ' : ''}${user['9']}`,
                  }
               })
            } else {
               res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ status: 'error', message: 'users search failed' })
               return
            }
         }

         if (dto.groups.length > 0) {
            const groupsCriteria: ISearch = {
               forcedisplay: [
                  1,    // completename
                  2,    // id
                  14,   // name
               ],
               filters: dto.groups.map(id => ({
                  link: 'OR',
                  field: 2,
                  searchtype: 'equals',
                  value: id,
               })),
            }

            const groupsRet = await glpi.Search('Group', groupsCriteria)

            if (groupsRet.status === HttpStatus.OK && groupsRet.data && Array.isArray(groupsRet.data)) {
               groupsRet.data.forEach(group => {
                  groups[group['2']] = {
                     fullName: group['1'],
                     name: group['14'],
                  }
               })
            } else {
               res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ status: 'error', message: 'group search failed' })
               return
            }
         }

         res.status(HttpStatus.OK).json({ users: users, groups: groups })
      })
   }
}
