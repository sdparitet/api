import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository, Like } from "typeorm";
import { Request } from 'express';
import * as moment from 'moment';
import { Moment } from 'moment';

import { Stat_RequestTicketDto } from '~stat/dto/post-request-dto';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { Connection } from "mariadb";
import { ILogData, IUserLogDto, IUserLogData, IUserLogDataNormalized } from '~stat/types';
import { STAT_DB_CONNECTION } from '~root/src/constants';
import { Stat_Ticket } from '~stat/entity/ticket.entity';
import { Stat_ALLTicket } from '~stat/entity/all_ticket.entity';
import { ITicketDto } from '~root/src/shared';
import { Stat_UserLogs } from '~stat/entity/user_logs.entity';

@Injectable()
export class Stat_Service {
   constructor(
      private schedulerRegistry: SchedulerRegistry,
      @InjectDataSource(STAT_DB_CONNECTION)
      private readonly connection: Connection,
      @InjectRepository(Stat_Ticket, STAT_DB_CONNECTION)
      private readonly statRepository: Repository<Stat_Ticket>,
      @InjectRepository(Stat_ALLTicket, STAT_DB_CONNECTION)
      private readonly allStatRepository: Repository<Stat_ALLTicket>,
      @InjectRepository(Stat_UserLogs, STAT_DB_CONNECTION)
      private readonly userLogsRepository: Repository<Stat_UserLogs>
   ) { }

   private readonly logger = new Logger(Stat_Service.name);


   // Define work range
   private readonly workHoursStart = 8;
   private readonly workHoursEnd = 17;

   async GetTickets(req: Request, dto: Stat_RequestTicketDto) {
      const options: FindManyOptions<Stat_ALLTicket> = {
         where: {
            isDeleted: dto.isDeleted
         },
         take: dto.pageSize || 100,
         skip: (dto.pageSize || 100) * Math.max((dto.pageNum || 0), 0)
      }

      let dateFilter = false
      const switchFilter = dto.filters.find(f => f.field === 'date')
      if (switchFilter != null) {
         dateFilter = switchFilter.values as boolean
      }

      let likeFilter = '2024-01'

      dto.filters.forEach(filter => {
         switch (filter.field) {
            case 'year': {
               likeFilter = filter.values[0] + likeFilter.slice(4,7)
               break
            }
            case 'month': {
               likeFilter = likeFilter.slice(0,5) + filter.values[0]
               break
            }
            case 'cat': {
               if (filter.values[0] !== 'Без категории') {
                  options.where = {
                     ...options.where,
                     category: Like(filter.values[0] + '%'),
                  }
               }
               break
            }
         }
      })
      if (!dateFilter) {
         options.where = {
            ...options.where,
           date_creation: Like(likeFilter + '%')
         }
      }
      else {
         options.where = {
            ...options.where,
            date_solve: Like(likeFilter + '%')
         }
      }

      const count = await this.allStatRepository.count(options)
      const data = await this.allStatRepository.find({
         ...options, order: {
            date_creation: "DESC",
         }
      })
      return {
         pageNum: dto.pageNum,
         pageSize: dto.pageSize,
         total: count,
         data: data
      } as ITicketDto
   }

   //   1   linked_action = 20 AND id_search_option = 0 - создание заявки
   //   2   linked_action = 16 AND id_search_option = 0 - снятие спеца
   //   3   linked_action = 15 AND id_search_option = 5 - назначение
   //   4   linked_action = 15 AND id_search_option = 6 - назначение поставщика
   //   5   linked_action = 15 AND id_search_option = 8 - назначение группы
   //   6   linked_action = 0 AND id_search_option = 12 - статус (1 - новая, 2 в работе, 3 - запланирована, 4 - ожидание, 5 - решена, 6 - закрыта)
   //   7   linked_action = 0 AND id_search_option = 17 - дата решения
   //   8   linked_action = 0 AND id_search_option = 16 - дата закрытия

   @Cron('*/5 * * * * *', { name: 'TicketUpdate' })
   private async handleCron() {
      const job = this.schedulerRegistry.getCronJob('TicketUpdate');
      job.stop()
      this.logger.verbose('START: Ticket update');

      try {

         //#region [ SQL ]
         const holidays = (await this.connection.query('' +
            'select begin_date as begin, end_date as end ' +
            'from glpi.glpi_calendars_holidays ch ' +
            '   left join glpi.glpi_holidays h on h.id = ch.holidays_id ' +
            'where ch.calendars_id = 1 ' +
            ';') as {begin:string, end:string}[])
            .map(h => ({
               begin: moment(h.begin).startOf('day'),
               end: moment(h.end).endOf('day')
            }))

         const ticketsToAdd = (await this.connection.query('' +
            'select t.id ' +
            'from glpi.glpi_tickets t ' +
            'where t.id not in (select ticket_id as id from stat.ticket) ' +
            'limit 10' +
            ';') as {id:number}[]).map(i => i.id).join(',')

         const getTicketsReaction = (await this.connection.query('' +
            'select s.ticket_id as id ' +
            'from stat.ticket s ' +
            'where s.last_update + interval - 1 DAY < current_timestamp ' +
            '                                   and s.ticket_status < 5 ' +
            '                                   and s.reaction <= 0 ' +
            'order by s.last_update desc ' +
            'limit 100' +
            ';') as {id:number}[]).map(i => i.id).join(',')

         const getTicketsSolution = (await this.connection.query('' +
            'select s.ticket_id as id ' +
            'from stat.ticket s ' +
            'where s.last_update + interval - 1 DAY < current_timestamp ' +
            '                                   and s.ticket_status < 5 ' +
            '                                   and s.solution <= 0 ' +
            'order by s.last_update desc ' +
            'limit 100' +
            ';') as {id:number}[]).map(i => i.id).join(',')

         const getTicketsToUpdate = async (interval: string, limit= 10, status = 5, desc = false) => (await this.connection.query('' +
            'select s.ticket_id as id ' +
            'from stat.ticket s ' +
            `where s.last_update + interval ${interval} < current_timestamp ` +
            `       and s.ticket_status < ${status} ` +
            `order by s.ticket_id ${desc ? 'desc' : ''} ` +
            `limit ${limit}` +
            ';') as {id:number}[]).map(i => i.id).join(',')
         const getLogs = async (tickets: string) => (await this.connection.query('' +
            'select * ' +
            'from (select l.items_id as ticket_id ' +
            '           , l.date_mod as l_date ' +
            '           , if(l.linked_action = 20 and l.id_search_option = 0, 1 ' +
            '           , if(l.linked_action = 16 and l.id_search_option = 0, 2 ' +
            '           , if(l.linked_action = 15 and l.id_search_option = 5, 3 ' +
            '           , if(l.linked_action = 15 and l.id_search_option = 6, 4 ' +
            '           , if(l.linked_action = 15 and l.id_search_option = 8, 5 ' +
            '           , if(l.linked_action = 0 and l.id_search_option = 12, 6 ' +
            '           , if(l.linked_action = 0 and l.id_search_option = 17, 7 ' +
            '           , if(l.linked_action = 0 and l.id_search_option = 16, 8 ' +
            '           , 0))))))))  as l_type ' +
            '           , l.old_value ' +
            '           , l.new_value ' +
            '           , t.entities_id ' +
            '           , t.name ' +
            '           , t.date ' +
            '           , t.closedate ' +
            '           , t.solvedate ' +
            '           , t.status ' +
            '           , t.type ' +
            '           , t.date_creation ' +
            '      from glpi.glpi_logs l ' +
            '          left join glpi.glpi_tickets t on t.id = l.items_id ' +
            '      where l.itemtype = \'Ticket\' ' +
            '        and l.linked_action in (0, 15, 16, 20) ' +
            '        and l.id_search_option in (0, 5, 6, 8, 12, 16, 17) ' +
            `        and l.items_id in (${tickets})) tl ` +
            'where l_type > 0 ' +
            ';')) as ILogData[]

         const userLogsQuery = '' +
            'select u.id ' +
            '     , if (u.l_type = 2, @i := @i + 1, if (u.l_type = 3, @i := @i - 1, @i)) as i ' +
            '     , u.fotfield as fot ' +
            '     , u.ticket_id ' +
            '     , u.start ' +
            '     , u.end ' +
            'from (select * ' +
            '           , if( ' +
            '                l_type = 2 ' +
            '                or (l_type = 6 and (old_value >= 4 and new_value < 4)) ' +
            '            , l_date, null ' +
            '             ) as start ' +
            '           , if( ' +
            '                l_type = 3 ' +
            '                or l_type = 7 ' +
            '                or l_type = 8 ' +
            '                or (l_type = 6 and (old_value < 4 and new_value >= 4)) ' +
            '            , l_date, null ' +
            '             ) as end ' +
            '      , @i:= 0 ' +
            '      from user_logs ' +
            '      ) u ' +
            'where (start is not null or end is not null) ';

         const getUserLogsByTickets = async (tickets: string) => normalizeUserLogData(await this.connection.query(userLogsQuery +
            `  and ticket_id in (${tickets}) ` +
            'order by id, ticket_id ' +
            ';') as IUserLogDto[])

         const getUserLogsByUsers = async (users: string, tId: number) => normalizeUserLogData(await this.connection.query(userLogsQuery +
            `  and id in (${users}) ` +
            `  and ticket_id <> ${tId} ` +
            'order by id, ticket_id ' +
            ';') as IUserLogDto[])


         const normalizeUserLogData = (dataS: IUserLogDto[] = []):IUserLogDataNormalized[] => {
            const data = dataS.map(ul => ({
               ...ul,
               fot: Number(ul.fot),
               start: ul.start ? moment(ul.start) : null,
               end: ul.end ? moment(ul.end) : null,
            }) as IUserLogData)

            const normalizedData:IUserLogDataNormalized[] = []
            let startDate: Moment|null = null
            let endDate: Moment|null = null

            data.forEach(d => {
               if (startDate === null && d.i > 0 && d.start !== null) startDate = d.start.clone();
               if (startDate !== null && endDate === null && d.end !== null) endDate = d.end.clone();
               if (startDate !== null && endDate !== null) {
                  normalizedData.push({...d, start: startDate, end: endDate})
                  // console.log('== + normalizedData =', startDate, endDate)
                  startDate = null
                  endDate = null
               }
            })
            if (startDate !== null && endDate === null) {
               normalizedData.push({...data[0], start: startDate, end: moment(moment.now())})
               // console.log('== - normalizedData =', normalizedData[normalizedData.length-1].start, normalizedData[normalizedData.length-1].end)
            }

            return normalizedData
         }
         //#endregion

         const workingHoursBetweenDates = (startDate: Moment, endDate: Moment) => {
            // Store minutes worked
            let minutesWorked = -1;

            // Validate input
            if (endDate.isBefore(startDate, 'minute')) { return 0; }

            // Loop from your Start to End dates (by hour)
            let current = startDate.clone();


            // Loop while currentDate is less than end Date (by minutes)
            while(current <= endDate){

               let skipDay = false
               holidays.forEach(h => {
                  if (current.isBetween(h.begin, h.end)) { skipDay = true }
               })

               if (!skipDay) {
                  // Is the current time within a work day (and if it occurs on a weekend or not)
                  if (current.hour() >= this.workHoursStart &&
                     current.hour() < this.workHoursEnd &&
                     current.day() !== 0 &&
                     current.day() !== 6
                  ) {
                     minutesWorked++;
                  }
                  else {
                     current = current.endOf('day').add(this.workHoursStart, 'hour')
                  }
                  current = current.add(1, 'minute');
               }
               else {
                  current = current.add(1, 'day');
               }
            }


            const minutesOfBreaks = minutesWorked >= 0 ? (Math.floor(minutesWorked / 60 / 9) + (minutesWorked / 60 % 9 > 4 ? 1 : 0)) * 60 : 0
            // Return the number of hours
            return Math.max(0, minutesWorked - minutesOfBreaks);
         }

         const updateTickets = async (ticketList: string) => {

            const logData = await getLogs(ticketList);
            const ulTicketData = await getUserLogsByTickets(ticketList);

            // const uniqueIds = [ ...new Set(logData.map(l => l.ticket_id))]
            const uniqueIds = ticketList.split(',').map(Number)

            for (const tId of uniqueIds) {
               const tData = logData.filter(l => l.ticket_id === tId)
               if (!tData || tData.length === 0) continue;

               let startDate = moment(tData[0].date_creation)
               let solveDate = moment(tData[0].date_creation)
               let status = 0

               let isAwaits = false
               let startWait = moment(tData[0].date_creation)
               let waitMinutes = 0

               let reaction = -1
               let reactionNum = 0

               let isActive = true
               let isSolved = false
               let stampDate = moment(tData[0].date_creation)
               let solve = -1


               //   1   linked_action = 20 AND id_search_option = 0 - создание заявки
               //   2   linked_action = 16 AND id_search_option = 0 - снятие спеца
               //   3   linked_action = 15 AND id_search_option = 5 - назначение
               //   4   linked_action = 15 AND id_search_option = 6 - назначение поставщика
               //   5   linked_action = 15 AND id_search_option = 8 - назначение группы
               //   6   linked_action = 0 AND id_search_option = 12 - статус (1 - новая, 2 в работе, 3 - запланирована, 4 - ожидание, 5 - решена, 6 - закрыта)
               //   7   linked_action = 0 AND id_search_option = 17 - дата решения
               //   8   linked_action = 0 AND id_search_option = 16 - дата закрытия

               tData.forEach(td => {
                  switch (td.l_type) {
                     case 1: {
                        isActive = true
                        startDate = moment(td.l_date)
                        stampDate = moment(td.l_date)
                        break
                     }
                     case 2: {
                        reactionNum--;
                        if (reactionNum <= 0 && isActive) {
                           solve = solve + workingHoursBetweenDates(stampDate, moment(td.l_date))
                           reactionNum = 0
                           isActive = false
                        }
                        break
                     }
                     case 3:
                     case 4:
                     case 5: {
                        if (reaction === -1) {
                           reaction = workingHoursBetweenDates(startDate, moment(td.l_date))
                        }
                        if (reactionNum === 0 && !isSolved) {
                           stampDate = moment(td.l_date)
                           isActive = true
                        }
                        reactionNum++;
                        break
                     }
                     case 6: {
                        if (Number(td.old_value) > 4 && Number(td.new_value) <= 3) {
                           isActive = true
                           isSolved = false
                           stampDate = moment(td.l_date)
                        }
                        if (Number(td.new_value) > 4 && isActive) {
                           solve = solve + workingHoursBetweenDates(stampDate, moment(td.l_date))
                           isActive = false
                           isSolved = true
                           solveDate = moment(td.l_date)
                        }
                        status = Number(td.new_value)
                        if (status === 4) {
                           isAwaits = true
                           startWait = moment(td.l_date)
                        }
                        if (Number(td.old_value) === 4 && Number(td.new_value) !== 4) {
                           isAwaits = false
                           waitMinutes = waitMinutes + workingHoursBetweenDates(startWait, moment(td.l_date))
                        }
                        break
                     }
                     case 7:
                     case 8: {
                        if (isActive) {
                           solve = solve + workingHoursBetweenDates(stampDate, moment(td.l_date))
                           isActive = false
                           isSolved = true
                           solveDate = moment(td.l_date)
                        }
                        break
                     }
                  }
               })

               if (!isSolved && isActive) {
                  solve = solve + workingHoursBetweenDates(stampDate, moment())
                  solveDate = moment()
               }
               solve = status > 4 ? Math.max(0, solve) : solve


               // Calc cost
               let cost = 0
               const ulTicketDataT = ulTicketData
                  .filter(u => u.ticket_id === tId)
               // console.log('+ ulTicketDataT: ', ulTicketDataT.length, ulTicketDataT[0] || [])

               if (ulTicketDataT && ulTicketDataT.length > 0) {

                  const actingUsers = [...new Set(ulTicketDataT.map(ul => ul.id))]
                  // console.log('++ actingUsers: ', actingUsers.length, actingUsers)
                  const ulTicketDataU = await getUserLogsByUsers(actingUsers.join(','), tId)
                  // console.log('+++ ulTicketDataU: ', startDate, solveDate, ulTicketDataU.length, ulTicketDataU[0] || [])

                  let currentTime = startDate.clone().add(-1, 'minute')
                  while (currentTime <= solveDate) {
                     currentTime = currentTime.add(1, 'minute')

                     // region skip not working time
                     let skip = false
                     holidays.forEach(h => {
                        if (currentTime.isBetween(h.begin, h.end)) skip = true;
                     })
                     if (currentTime.hour() < this.workHoursStart ||
                        currentTime.hour() >= this.workHoursEnd ||
                        currentTime.day() === 0 ||
                        currentTime.day() === 6
                     ) skip = true;
                     if (skip) {
                        currentTime = currentTime.endOf('day').add(this.workHoursStart, 'hour')
                        continue;
                     }
                     // endregion

                     actingUsers.forEach(u => {
                        const userTicketData = ulTicketDataT.filter(d => d.id === u)
                        if (userTicketData.length > 0) {
                           userTicketData.forEach(d => {
                              if (currentTime.isBetween(d.start, d.end)) {
                                 const otherTicketCount = Math.max( 1, [...new Set(ulTicketDataU
                                    .filter(du => du.id === u && currentTime.isBetween(du.start, du.end))
                                    .map(ul => ul.ticket_id))].length || 0)
                                 const fot = (userTicketData[0].fot || 0) / actingUsers.length / otherTicketCount

                                 cost = cost + fot
                                 // console.log('==> ',`${tId} ${currentTime.format('LLL')},  U:${u}  F:${userTicketData[0].fot || 0}  Uc: ${actingUsers.length}  Oc:${otherTicketCount}  M:${fot}  C:${Math.round((cost + Number.EPSILON) * 100) / 100}`);
                              }
                           })
                        }
                     })

                  }
                  cost = Math.round((cost + Number.EPSILON) * 100) / 100


                  // const normalizedUserLogData: IUserLogDataNormalized[] = []

                  // actingUsers.forEach(u => {
                  //    const usersData = ulTicketDataT.filter(ul => ul.id === u && ul.ticket_id === tId)
                  //    if (usersData.length) {
                  //       console.log('++++ usersData: ', usersData.length, usersData[1] || [])
                  //
                  //       let startDate: Moment|null = null
                  //       let endDate: Moment|null = null
                  //
                  //       usersData.forEach(ud => {
                  //          console.log('+++++ se ?', ud.start, ud.end)
                  //          if (startDate === null && ud.start !== null) startDate = ud.start.clone();
                  //          if (startDate !== null && endDate === null && ud.end !== null) endDate = ud.end.clone();
                  //          if (startDate !== null && endDate !== null) {
                  //             normalizedUserLogData.push({...ud, start: startDate, end: endDate})
                  //             console.log('+++++ normalizedUserLogData =', startDate, endDate)
                  //             startDate = null
                  //             endDate = null
                  //          }
                  //       })
                  //       if (startDate !== null && endDate === null) {
                  //          normalizedUserLogData.push({...usersData[0], start: startDate, end: moment(moment.now())})
                  //          console.log('+++++- normalizedUserLogData =', startDate, endDate, usersData[0])
                  //       }
                  //       console.log('++++++ normalizedUserLogData: ', Object.keys(normalizedUserLogData).length, normalizedUserLogData[Object.keys(normalizedUserLogData)[0]])
                  //
                  //    }
                  // })


                  // let currentTime = startDate.clone().add(-1, 'minute')
                  // while (Object.keys(normalizedUserLogData).length > 0 && currentTime <= solveDate) {
                  //    currentTime = currentTime.add(1, 'minute')
                  //
                  //    // working time check
                  //    let skip = false
                  //    holidays.forEach(h => {
                  //       if (currentTime.isBetween(h.begin, h.end)) skip = true;
                  //    })
                  //    if (currentTime.hour() < this.workHoursStart ||
                  //       currentTime.hour() >= this.workHoursEnd ||
                  //       currentTime.day() === 0 ||
                  //       currentTime.day() === 6
                  //    ) skip = true;
                  //
                  //    if (skip) {
                  //       currentTime = currentTime.endOf('day').add(this.workHoursStart, 'hour')
                  //       continue;
                  //    }
                  // }

                  // const actingUsers = [...new Set(userLogUserData.map(ul => ul.id))]
                  //
                  // let currentTime = startDate.clone().add(-1, 'minute')
                  // while (currentTime <= solveDate) {
                  //    currentTime = currentTime.add(1, 'minute')
                  //
                  //    // working time check
                  //    let skip = false
                  //    holidays.forEach(h => {
                  //       if (currentTime.isBetween(h.begin, h.end)) skip = true;
                  //    })
                  //    if (currentTime.hour() < this.workHoursStart ||
                  //       currentTime.hour() >= this.workHoursEnd ||
                  //       currentTime.day() === 0 ||
                  //       currentTime.day() === 6
                  //    ) skip = true;
                  //    if (skip) {
                  //       currentTime = currentTime.endOf('day').add(this.workHoursStart, 'hour')
                  //       continue;
                  //    }
                  //
                  //    const allTickets = userLogUserData
                  //       .filter(ul => actingUsers.includes(ul.id) && ul.start <= currentTime && ul.end >= currentTime )
                  //
                  //    if (allTickets.length) {
                  //       actingUsers.forEach(u => {
                  //          const filtered = allTickets.filter(ul => ul.id === u)
                  //          if (filtered.length) {
                  //             const fot = filtered[0].fot || 0
                  //             const minuteCost = fot / (filtered.length || 1)
                  //             cost = Math.round((cost + minuteCost + Number.EPSILON) * 100) / 100
                  //
                  //             // console.log('==> ',`${tId} ${currentTime.format('LLL')}, U:${u} F:${fot} T:${filtered.length} M:${minuteCost} C:${cost}`);
                  //          }
                  //       })
                  //    }
                  // }
               }

               await this.statRepository.upsert({
                  ticket_id: tId,
                  reaction: reaction >= 0 ? reaction : 0,
                  solution: solve >= 0 ? solve : 0,
                  cost: cost,
                  ticket_status: status,
               }, {
                  skipUpdateIfNoValuesChanged: true,
                  conflictPaths: ['ticket_id'],
                  upsertType: 'on-conflict-do-update',
               })
            }
         }

         if (ticketsToAdd && ticketsToAdd.length > 0) {
            await updateTickets(ticketsToAdd)
         }

         if (getTicketsReaction && getTicketsReaction.length > 0) {
            await updateTickets(getTicketsReaction)
         }

         if (getTicketsSolution && getTicketsSolution.length > 0) {
            await updateTickets(getTicketsSolution)
         }

         const updateLimit = process.env.NODE_ENV === 'development' ? 10 : 100

         let ticketsToUpdate = await getTicketsToUpdate('1 DAY', updateLimit, 5)
         if (ticketsToUpdate && ticketsToUpdate.length > 0) {
            await updateTickets(ticketsToUpdate)
         }

         ticketsToUpdate = await getTicketsToUpdate('1 HOUR', updateLimit, 6, true)
         if (ticketsToUpdate && ticketsToUpdate.length > 0) {
            await updateTickets(ticketsToUpdate)
         }

      }
      catch (e) {
         this.logger.error(`ERROR Ticket update:  ${e.message || ''}`);
      }

      this.logger.warn('END: Ticket update');
      if (process.env.NODE_ENV === 'development') return
      job.start()
   }

}
