import { Injectable } from '@nestjs/common'
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm"
import { Request } from 'express';

import { getTokenData } from '~root/src/apis/helpers';
import { OIT_GetAccidentsDto } from '~arm/oit/dto/get-dto';
import { Oit_AddAccidentDto } from '~arm/oit/dto/post-dto'
import { KPI_DB_CONNECTION } from '~root/src/constants';
import { Oit_Group, Oit_Group_Dto } from '~arm/oit/entity/group.entity'
import { Oit_Accident } from '~arm/oit/entity/accident.entity'

@Injectable()
export class Oit_Service {
   constructor(
      @InjectRepository( Oit_Group, KPI_DB_CONNECTION)
      private groupRepository: Repository<Oit_Group>,
      @InjectRepository( Oit_Accident, KPI_DB_CONNECTION)
      private accidentRepository: Repository<Oit_Accident>,
   ) { }

   async getGroups(req: Request) {
      const userData = getTokenData(req)
      return (await this.groupRepository.find({
         where: [{ roleRead: In(userData.userRoles || []) }]
      })).map(g => ({
         id: g.id,
         name: g.name,
         path: g.path,
         read: (userData.userRoles || []).includes(g.roleRead),
         write: (userData.userRoles || []).includes(g.roleWrite),
      } as Oit_Group_Dto))
   }

   async getAccidents(dto: Partial<OIT_GetAccidentsDto>, req: Request) {
      const userData = getTokenData(req)
      return await this.accidentRepository.find({
         relations: {
            group: false
         },
         where: {
            date: dto.dateAfter && dto.dateBefore ? Between(dto.dateAfter, dto.dateBefore)
               : dto.dateAfter ? MoreThanOrEqual(dto.dateAfter)
               : dto.dateBefore ? LessThanOrEqual(dto.dateBefore)
               : undefined,
            groupId: dto.groupIds && dto.groupIds.length > 0 ? In(dto.groupIds) : undefined,
            group: {
               roleRead: In(userData.userRoles || [])
            }
         }
      })
   }

   async addAccident(dto: Oit_AddAccidentDto, req: Request) {
      const userData = getTokenData(req)
      const groups = await this.groupRepository.find({
         where: {
            id: In(dto.groupIds || [])
         }
      })
      if (groups) {
         for (const group of groups) {
            if ((userData.userRoles || []).includes(group.roleWrite)) {
               const accident: Partial<Oit_Accident & { groupIds: number[] }> = {
                  ...dto,
                  group: group,
               }
               delete accident.groupIds

               if (await this.accidentRepository.exists({
                  where: {
                     group: accident.group,
                     date: accident.date
                  }
               })) {
                  await this.accidentRepository.update({
                     groupId: group.id,
                     date: accident.date,
                  }, accident)
               }
               else {
                  await this.accidentRepository.insert(accident)
               }
            }
         }

      }
   }

   async removeAccident(dto: Partial<Oit_AddAccidentDto>) {
      await this.accidentRepository.delete({
         id: dto.id || -1
      })
   }

}
