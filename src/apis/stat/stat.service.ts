import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, Repository, Like } from "typeorm";
import { Request } from 'express';

import { Stat_RequestTicketDto } from '~stat/dto/post-request-dto';
import { STAT_DB_CONNECTION } from '~root/src/constants';
import { Stat_ALLTicket } from '~stat/entity/all_ticket.entity';
import { ITicketDto } from '~root/src/shared';

@Injectable()
export class Stat_Service {
   constructor(
      @InjectRepository(Stat_ALLTicket, STAT_DB_CONNECTION)
      private readonly allStatRepository: Repository<Stat_ALLTicket>,
   ) { }

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

}
