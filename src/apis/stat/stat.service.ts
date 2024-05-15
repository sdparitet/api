import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository, Like } from "typeorm";
import { Request } from 'express';
import * as moment from 'moment';
import { Moment } from 'moment';

import { Stat_RequestTicketDto } from '~stat/dto/post-request-dto';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { Connection } from "mariadb";
import {
   IShortLogData,
   Stat_TicketDto,
   Stat_UserRecordTimers,
} from '~stat/types';
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

   private logTimeSpend = (start: Moment) => {
      const dif = moment(moment.now()).diff(start, 'milliseconds');
      this.logger.log(dif)
   }

   @Cron('*/5 * * * * *', { name: 'parseLogs' })
   private async parseLogsCronTask() {
      const tNow = moment(moment.now());
      const job = this.schedulerRegistry.getCronJob('parseLogs');
      job.stop()

      this.logTimeSpend(tNow);
      this.logger.verbose('START: Parse Logs');

      try {

         //#region [ SQL ]
         const holidays = (await this.connection.query('' +
            'select begin_date as begin, end_date as end ' +
            'from glpi.glpi_calendars_holidays ch ' +
            '   left join glpi.glpi_holidays h on h.id = ch.holidays_id ' +
            'where ch.calendars_id = 1 ' +
            ';'))
            .map((h: { begin: moment.MomentInput; end: moment.MomentInput; }) => ({
               begin: moment(h.begin).startOf('day'),
               end: moment(h.end).endOf('day')
            }))

         const ticketsToAdd = (await this.connection.query('' +
            'select t.id ' +
            'from glpi.glpi_tickets t ' +
            '    left OUTER join glpi.glpi_logs l on l.items_id = t.id and l.itemtype = \'Ticket\' ' +
            '    left OUTER join stat.short_logs s on s.tId = t.id ' +
            'where t.id not in (select id from stat.glpi_tickets) ' +
            '  and l.id is not null ' +
            '  and s.tId is not null ' +
            'limit 100 ' +
            ';') as {id:number}[]).map(i => i.id).join(',')

         const knownTickets = (await this.connection.query('' +
            'select id ' +
            'from stat.glpi_tickets t ' +
            'where t.status in (7,9) ' +
            // '  and t.cost > 0 ' +
            ';') as {id:number}[]).map(i => i.id)

         const logRaw = (await this.connection.query('select * from short_logs;')).map((l: {
               action: string;
               aId: string;
               fot: string;
               nValId: string;
               tCreate: string;
               tSolve: string | null;
               tClose: string | null;
               date: string;
            }) =>
               ({
                  ...l,
                  action: Number(l.action),
                  aId: Number(l.aId),
                  fot: Number(l.fot),
                  nValId: Number(l.nValId),
                  tCreate: moment(l.tCreate) || moment(moment.now()),
                  tSolve: l.tSolve ? moment(l.tSolve) : moment(moment.now()),
                  tClose: l.tClose ? moment(l.tClose) : (l.tSolve ? moment(l.tSolve) : moment(moment.now())),
                  date: moment(l.date),
               })) as IShortLogData[]
         //#endregion

         //# region [ Functions ]
         const newTicket = (data?: Partial<Stat_TicketDto>): Stat_TicketDto => ({...{
            tId: -1,
            status: -1,
            reaction: -1,
            solution: -1,
            cost: -1,
            last_log: 0,
            user: {}
         },...(data || {})})

         const workingMinutesBetweenDates = (startDate: Moment, endDate: Moment) => {
            // Store minutes worked
            let minutesWorked = -1;

            // Validate input
            if (endDate.isBefore(startDate, 'minute')) { return 0; }

            // Loop while currentDate is less than end Date (by minutes)
            let current = startDate.clone();
            while(current.isSameOrBefore(endDate, 'minute')){

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

         const normalizeLogs = (logs: IShortLogData[]) => {

            const ret:  Stat_TicketDto[] = [];

            let ticket = newTicket();
            let userTimers: Record<string, Stat_UserRecordTimers> = {};

            [...new Set(logs.map(i => i.tId))].forEach(tId => {

               ticket = newTicket({ tId: tId })

               const ticketLogs = logs.filter(i => i.tId === tId).sort((a, b) => a.lId - b.lId)
               userTimers = {}
               let tStamp = ticketLogs[0].tCreate.clone()
               let tReaction = 0
               let tActive = false

               ticketLogs.forEach((log) => {
                  ticket.last_log = log.lId
                  ticket.status = log.action < 10
                     ? ([7,9].includes(ticket.status) ? Math.max(ticket.status, log.action) : Math.max(0, log.action) )
                     : ticket.status

                  // # 1 - назначение
                  // # 2 - назначение Группа
                  // # 3 - снятие спеца
                  // # 4 - снятие Группы
                  // # 5 - статус (1 - новая, 2 в работе, 3 - запланирована, 4 - ожидание, 5 - решена, 6 - закрыта)
                  // # 6 - отмена решения
                  // # 7 - решено
                  // # 8 - переоткрытие
                  // # 9 - закрытие

                  try {
                     switch (log.action) {
                        case 1:
                        // case 2:
                        case 51:
                        case 52: {
                           if (log.action === 1) {
                              // console.log(`-${log.action}-`, log.date)
                              ticket.user[`${log.nValId}`] = {
                                 tUId: log.nValId,
                                 fot: log.fot > 0 ? log.fot : 0,
                                 isActive: true,
                                 timers: ticket.user[`${log.nValId}`]?.timers || []
                              }
                              tReaction++
                              if (ticket.reaction < 0) {
                                 ticket.reaction = workingMinutesBetweenDates(log.tCreate, log.date)
                              }
                           }

                           Object.keys(ticket.user).forEach(uid => {
                              if (ticket.user[uid].isActive) {
                                 // console.log(`-${log.action}-`, uid, userTimers[uid])
                                 userTimers[uid] = {
                                    tStart: log.date.clone(),
                                    tStop: log.date.clone(),
                                 }
                              }
                           })

                           if (log.action !== 51) {
                              tActive = true
                           }
                           break;
                        }
                        // case 4:
                        case 3: {
                           // console.log(`-${log.action}-`, log.date)
                           if (log.action === 3) {
                              if (ticket.user[`${log.oValId}`]?.isActive && userTimers[`${log.oValId}`]) {
                                 // console.log(`-${log.action}-`, log.oValId, userTimers[`${log.oValId}`])
                                 userTimers[`${log.oValId}`].tStop = log.date.clone()
                                 ticket.user[`${log.oValId}`].timers.push(userTimers[`${log.oValId}`])
                                 userTimers[`${log.oValId}`] = undefined
                                 ticket.user[`${log.oValId}`].isActive = false
                              }
                              tReaction--
                           }
                           if (tReaction <= 0 && tActive) {
                              tReaction = 0
                              ticket.solution = ticket.solution + workingMinutesBetweenDates(tStamp, log.date)
                           }
                           break;
                        }
                        case 53:
                        case 54: {
                           // console.log(`-${log.action}-`, log.date)
                           if (tReaction > 0 && tActive) {
                              ticket.solution = ticket.solution + workingMinutesBetweenDates(tStamp, log.date)
                           }
                           tActive = false
                           Object.keys(ticket.user).forEach(uid => {
                              if (ticket.user[uid].isActive && userTimers[uid]) {
                                 // console.log(`-${log.action}-`, uid, userTimers[uid])
                                 userTimers[uid].tStop = log.date.clone()
                                 ticket.user[uid].timers.push(userTimers[uid])
                                 userTimers[uid] = undefined
                              }
                           })
                           break;
                        }
                        case 55:
                        case 56:
                        case 7:
                        case 9: {
                           // console.log(`-${log.action}-`, log.date)
                           if (tActive) {
                              Object.keys(ticket.user).forEach(uid => {
                                 if (ticket.user[uid].isActive && userTimers[uid]) {
                                    // console.log(`-${log.action}-`, uid, userTimers[uid])
                                    userTimers[uid].tStop = log.date.clone()
                                    ticket.user[uid].timers.push(userTimers[uid])
                                    userTimers[uid] = undefined
                                 }
                              })
                              ticket.solution = workingMinutesBetweenDates(tStamp, log.date)
                           }
                           tActive = false
                           break;
                        }
                        case 6:
                        case 8: {
                           // console.log(`-${log.action}-`, log.date)
                           if (!tActive) {
                              tActive = true
                              tStamp = log.date.clone()
                              Object.keys(ticket.user).forEach(uid => {
                                 if (ticket.user[uid].isActive) {
                                    // console.log(`-${log.action}-`, uid, userTimers[uid])
                                    userTimers[uid] = {
                                       tStart: log.date.clone(),
                                       tStop: log.date.clone(),
                                    }
                                 }
                              })
                           }
                           break;
                        }
                     }
                  }
                  catch (e) {
                     console.error(tId, log, ticket, userTimers, e)
                     throw Error(e)
                  }

               })

               if ([2,52].includes(ticket.status)) {
                  Object.keys(ticket.user).forEach(uid => {
                     if (ticket.user[uid].isActive && userTimers[uid]) {
                        userTimers[uid].tStop = moment(moment.now())
                        ticket.user[uid].timers.push(userTimers[uid])
                        // console.log('!-!-!', ticket.tId, ticket.status, uid, userTimers[uid])
                     }
                  })
               }

               ret.push(ticket)
            })
            return ret
         }
         //#endregion


         this.logTimeSpend(tNow);
         // const logRaw = await getLogs(knownTickets, [444,575,3777,4788,4789].join(','))
         // const logRawFiltered = await getLogs(knownTickets, ticketsToAdd)
         console.log( 'Getting logs...', logRaw.length, knownTickets.length)

         const logRawFiltered = logRaw.filter(l => !knownTickets.includes(l.tId) )
         console.log( 'Getting filtered...', logRawFiltered.length)

         this.logTimeSpend(tNow);
         const ticketList = [...new Set<number>(logRawFiltered.map(l => l.tId))]
         console.log('Getting ticket Id\'s...', ticketList.length)

         this.logTimeSpend(tNow);
         const logs = normalizeLogs(logRawFiltered)
         console.log('Normalize logs...', logs.length)


         this.logTimeSpend(tNow);
         console.log('\nStart parsing...')
         for (const tId of ticketList) {
            if (process.env.NODE_ENV === 'development') this.logTimeSpend(tNow);

            const ticket = logs.find(l => l.tId === tId) || newTicket()
               // console.log('=1=', Object.keys(ticket.user).length)

            const ticketUserIds = Object.keys(ticket.user)
               // console.log('=2=', ticketUserIds.length, ticketUserIds)


            for (const uId of ticketUserIds) {
               for (const timer of ticket.user[uId].timers) {

                  let currentTime = timer.tStart.clone()
                  // console.log('=3=', workingMinutesBetweenDates(timer.tStart, timer.tStop))
                  while (currentTime.isSameOrBefore(timer.tStop, 'minute')) {

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

                     const otherTickets = logs
                        .filter(l =>
                           l.tId !== tId &&
                           Object.keys(l.user).includes(uId) &&
                           Object.keys(l.user).some(u =>
                              l.user[u].timers.some(t =>
                                 currentTime.isBetween(t.tStart, t.tStop)
                              )
                           )
                        ).length || 0

                     let cost = ticket.user[uId].fot / Math.max(1, otherTickets)
                     ticket.cost = Math.round((ticket.cost + cost + Number.EPSILON) * 100) / 100
                     // console.log('$$$ ', uId, otherTickets, cost, ticket.cost)

                     currentTime = currentTime.add(1, 'minute')
                  }
               }
            }

            // console.log('=9=', ticket, '\n');
            // if (Object.keys(ticket.user).length > 2 && ticket.cost > 0) console.log('===', ticket);


            const {user, ...ticketDto} = ticket;
            if (ticketDto.tId > 0) await this.statRepository.upsert({...ticketDto, id: tId}, {
               skipUpdateIfNoValuesChanged: true,
               conflictPaths: ['id'],
               upsertType: 'on-conflict-do-update',
            });
         }
         console.log('End parsing.\n'); this.logTimeSpend(tNow);
      }


      catch (e) {
         this.logTimeSpend(tNow);
         this.logger.error(`ERROR Parse Logs:  ${e || ''}`);
      }

      this.logger.warn('END: Parse Logs');
      // if (process.env.NODE_ENV === 'development') return
      job.start()
   }


}
