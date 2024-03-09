import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository } from "typeorm";
import { Request } from 'express';
import * as moment from 'moment';
import { Moment } from 'moment';

import { Stat_RequestTicketDto } from '~stat/dto/post-request-dto';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { Connection } from "mariadb";
import { ILogData } from '~stat/types';
import { STAT_DB_CONNECTION } from '~root/src/constants';
import { Stat_Ticket } from '~stat/entity/ticket.entity';
import { Stat_ALLTicket } from '~stat/entity/all_ticket.entity';
import { ITicketDto } from '~root/src/shared';
import * as process from 'process';

@Injectable()
export class Stat_Service {
   constructor(
      private schedulerRegistry: SchedulerRegistry,
      @InjectDataSource(STAT_DB_CONNECTION)
      private readonly connection: Connection,
      @InjectRepository(Stat_Ticket, STAT_DB_CONNECTION)
      private readonly statRepository: Repository<Stat_Ticket>,
      @InjectRepository(Stat_ALLTicket, STAT_DB_CONNECTION)
      private readonly allStatRepository: Repository<Stat_ALLTicket>
   ) { }

   private readonly logger = new Logger(Stat_Service.name);

   async GetTickets(req: Request, dto: Stat_RequestTicketDto) {
      const options: FindManyOptions<Stat_ALLTicket> = {
         where: {
            isDeleted: dto.isDeleted
         },
         take: dto.pageSize || 100,
         skip: (dto.pageSize || 100) * Math.max((dto.pageNum || 0), 0)
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

         const getTicketsToUpdate = async (interval: string, limit= 10, status = 5) => (await this.connection.query('' +
            'select s.ticket_id as id ' +
            'from stat.ticket s ' +
            `where s.last_update + interval ${interval} < current_timestamp ` +
            `       and s.ticket_status < ${status} ` +
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

         const workingHoursBetweenDates = (startDate: Moment, endDate: Moment) => {
            // Store minutes worked
            let minutesWorked = -1;

            // Validate input
            if (endDate.isBefore(startDate, 'minute')) { return 0; }

            // Loop from your Start to End dates (by hour)
            let current = startDate.clone();

            // Define work range
            const workHoursStart = 8;
            const workHoursEnd = 17;

            // Loop while currentDate is less than end Date (by minutes)
            while(current <= endDate){

               let skipDay = false
               holidays.forEach(h => {
                  if (current.isBetween(h.begin, h.end)) { skipDay = true }
               })

               if (!skipDay) {
                  // Is the current time within a work day (and if it occurs on a weekend or not)
                  if (current.hour() >= workHoursStart &&
                     current.hour() < workHoursEnd &&
                     current.day() !== 0 &&
                     current.day() !== 6
                  ) {
                     minutesWorked++;
                  }
                  else {
                     current.endOf('day').add(workHoursStart, 'hour')
                  }
                  current.add(1, 'minute');
               }
               else {
                  current.add(1, 'day');
               }
            }


            const minutesOfBreaks = minutesWorked >= 0 ? (Math.floor(minutesWorked / 60 / 9) + (minutesWorked / 60 % 9 > 4 ? 1 : 0)) * 60 : 0
            // Return the number of hours
            return Math.max(0, minutesWorked - minutesOfBreaks);
         }

         const updateTickets = async (ticketList: string) => {

            const logData = await getLogs(ticketList);
            const uniqueIds = [ ...new Set(logData.map(l => l.ticket_id))]

            for (const tId of uniqueIds) {
               const tData = logData.filter(l => l.ticket_id === tId)

               let startDate = moment(tData[0].date_creation)
               let status = 0

               let reaction = -1
               let reactionNum = 0

               let isActive = true
               let isSolved = false
               let solveDate = moment(tData[0].date_creation)
               let solve = -1

               tData.forEach(td => {
                  switch (td.l_type) {
                     case 1: {
                        isActive = true
                        startDate = moment(td.l_date)
                        solveDate = moment(td.l_date)
                        break
                     }
                     case 2: {
                        reactionNum--;
                        if (reactionNum <= 0 && isActive) {
                           solve = solve + workingHoursBetweenDates(solveDate, moment(td.l_date))
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
                           solveDate = moment(td.l_date)
                           isActive = true
                        }
                        reactionNum++;
                        break
                     }
                     case 6: {
                        if (Number(td.old_value) >= 4 && Number(td.new_value) <= 3) {
                           isActive = true
                           isSolved = false
                           solveDate = moment(td.l_date)
                        }
                        if (Number(td.new_value) >= 4 && isActive) {
                           solve = solve + workingHoursBetweenDates(solveDate, moment(td.l_date))
                           isActive = false
                           isSolved = true
                        }
                        status = Number(td.new_value)
                        break
                     }
                     case 7:
                     case 8: {
                        if (isActive) {
                           solve = solve + workingHoursBetweenDates(solveDate, moment(td.l_date))
                           isActive = false
                           isSolved = true
                        }
                        break
                     }
                  }
               })
               if (!isSolved && isActive) {
                  solve = solve + workingHoursBetweenDates(solveDate, moment())
               }

               solve = status > 4 ? Math.max(0, solve) : solve

               console.log(tData[0].ticket_id, tData[0].name, reaction, solve)

               await this.statRepository.upsert({
                  ticket_id: tId,
                  reaction: reaction,
                  solution: solve,
                  cost: 0,
                  ticket_status: status
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

         let ticketsToUpdate = await getTicketsToUpdate('1 DAY')
         if (ticketsToUpdate && ticketsToUpdate.length > 0) {
            await updateTickets(ticketsToUpdate)
         }

         ticketsToUpdate = await getTicketsToUpdate('1 HOUR')
         if (ticketsToUpdate && ticketsToUpdate.length > 0) {
            await updateTickets(ticketsToUpdate)
         }

         ticketsToUpdate = await getTicketsToUpdate('10 MINUTE', 100, 5)
         if (ticketsToUpdate && ticketsToUpdate.length > 0) {
            await updateTickets(ticketsToUpdate)
         }

         ticketsToUpdate = await getTicketsToUpdate('1 HOUR', 10, 6)
         if (ticketsToUpdate && ticketsToUpdate.length > 0) {
            await updateTickets(ticketsToUpdate)
         }

      }
      catch (e) {
         this.logger.error(`ERROR Ticket update:  ${e.message || ''}`);
      }

      this.logger.warn('END: Ticket update');
      if (process.env.NODE_ENV === 'production') {
         job.start()
      }
   }

}
