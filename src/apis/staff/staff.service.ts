import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Request } from 'express';

import { getTokenData } from '~root/src/apis/helpers';
import {  Staff_Category_Dto,  Staff_Category } from '~staff/entity/category.entity';
import {  Staff_Group,  Staff_Group_Dto } from '~staff/entity/group.entity';
import {  Staff_Position } from '~staff/entity/position.entity';
import {  Staff_Stat } from '~staff/entity/stat.entity';
import { STAFF_GetRequestDto } from '~staff/dto/get-request-dto';
import { STAFF_PostRequestDto, STAFF_EditPosDto } from '~staff/dto/post-request-dto'
import { KPI_DB_CONNECTION } from '~root/src/constants';

@Injectable()
export class Staff_Service {
   constructor(
      @InjectRepository( Staff_Category, KPI_DB_CONNECTION)
      private categoryRepository: Repository<Staff_Category>,
      @InjectRepository( Staff_Group, KPI_DB_CONNECTION)
      private groupRepository: Repository<Staff_Group>,
      @InjectRepository( Staff_Position, KPI_DB_CONNECTION)
      private positionRepository: Repository<Staff_Position>,
      @InjectRepository( Staff_Stat, KPI_DB_CONNECTION)
      private statRepository: Repository<Staff_Stat>,
   ) { }

   async getCategories(req: Request) {
      const userData = getTokenData(req)
      return (await this.categoryRepository.find({
         where: [
            { roleRead: In(userData.userRoles || []) },
         ]
      })).map(c => ({
         ...c,
         read: (userData.userRoles || []).includes(c.roleRead),
      } as  Staff_Category_Dto))
         .sort((a,b) => a.id - b.id)
   }

   async getGroups(req: Request) {
      const userData = getTokenData(req)
      return (await this.groupRepository.find({
         where: [
            { roleRead: In(userData.userRoles || []) },
            { roleWrite: In(userData.userRoles || []) }
         ], relations: { positions: true }
      })).map(g => ({
         ...g,
         read: (userData.userRoles || []).includes(g.roleRead),
         write: (userData.userRoles || []).includes(g.roleWrite),
      } as  Staff_Group_Dto))
   }

   async GetStaff(dto: STAFF_GetRequestDto, req: Request) {
      const userData = getTokenData(req)
      return await this.statRepository.find({
         relations: {
            position: true
         },
         where: {
            year: dto.year,
            position: {
               group: {
                  roleRead: In(userData.userRoles || [])
               }
            }
         }
      })
   }

   async SetStaff(dto: Array<STAFF_PostRequestDto> /*, req: Request*/) {
      // const userData = getTokenData(req)
      for (const d of dto) {
         const cat = await this.categoryRepository.findOne({
            where: {
               id: d.category
            }
         })
         const pos = await this.positionRepository.findOne({
            where: {
               id: d.position
            }
         })
         const staff: Staff_Stat = {
            ...d,
            year: Number(d.year),
            value: Number(d.value),
            category: cat,
            position: pos,
            categoryId: d.category,
            positionId: d.position,
         }

         if (await this.statRepository.exists({
            where: {
               year: staff.year,
               categoryId: staff.categoryId,
               positionId: staff.positionId,
               month: staff.month
            }
         })) {
            // update.push(kpi)
            await this.statRepository.update({ year: staff.year, categoryId: staff.categoryId, positionId: staff.positionId, month: staff.month }, staff)
         }
         else {
            // insert.push(kpi)
            await this.statRepository.insert(staff)
         }
      }

      // await this.statRepository.upsert(upsert, ['date', 'productId'])
   }

   async EditPosition(dto: Partial<STAFF_EditPosDto>) {
      const pos = await this.positionRepository.findOne({
         where: {
            id: dto.id || -1
         }
      })
      if (pos) {
         await this.positionRepository.update({
            id: pos.id,
         }, {
            ...pos,
            name: dto.name || pos.name,
         })
      }
      // else if (dto.groupId && dto.name.length > 0) {      # ToDo Я не знаю почему было удалено dto.id нужно узнать
      else if (dto.id && dto.groupId && dto.name.length > 0) {
         const grp = await this.groupRepository.findOne({
            where: {
               id: dto.groupId || -1
            }
         })
         if (grp) {
            await this.positionRepository.insert({
               ...dto,
               group: grp,
               stats: []
            })
         }
      }
   }

   async RemovePosition(dto: Partial<STAFF_EditPosDto>) {
      const pos = await this.positionRepository.findOne({
         where: {
            id: dto.id || -1
         }
      })
      if (pos) {
         await this.positionRepository.remove(pos)
      }
   }

}
