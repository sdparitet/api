import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Request } from 'express';
import { Oup_Location, Oup_Location_Dto } from '~arm/oup/entity/location.entity'

import { getTokenData } from '~root/src/apis/helpers';
import {  Oup_Category_Dto,  Oup_Category } from '~arm/oup/entity/category.entity';
import {  Oup_Group,  Oup_Group_Dto } from '~arm/oup/entity/group.entity';
import {  Oup_Position } from '~arm/oup/entity/position.entity';
import {  Oup_Stat } from '~arm/oup/entity/stat.entity';
import { OUP_GetRequestDto } from '~arm/oup/dto/get-request-dto';
import { OUP_PostRequestDto, OUP_EditPosDto } from '~arm/oup/dto/post-request-dto'
import { KPI_DB_CONNECTION } from '~root/src/constants';

@Injectable()
export class Oup_Service {
   constructor(
      @InjectRepository( Oup_Category, KPI_DB_CONNECTION)
      private categoryRepository: Repository<Oup_Category>,
      @InjectRepository( Oup_Location, KPI_DB_CONNECTION)
      private locationRepository: Repository<Oup_Location>,
      @InjectRepository( Oup_Group, KPI_DB_CONNECTION)
      private groupRepository: Repository<Oup_Group>,
      @InjectRepository( Oup_Position, KPI_DB_CONNECTION)
      private positionRepository: Repository<Oup_Position>,
      @InjectRepository( Oup_Stat, KPI_DB_CONNECTION)
      private statRepository: Repository<Oup_Stat>,
   ) { }

   async getLocations() {
      return (await this.locationRepository.find())
         .sort((a,b) => a.id - b.id) as Oup_Location_Dto[]
   }

   async getCategories(req: Request) {
      const userData = getTokenData(req)
      return (await this.categoryRepository.find({
         where: [
            { roleRead: In(userData.userRoles || []) },
         ]
      })).map(c => ({
         ...c,
         read: (userData.userRoles || []).includes(c.roleRead),
      } as  Oup_Category_Dto))
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
      } as  Oup_Group_Dto))
   }

   async GetStaff(dto: OUP_GetRequestDto, req: Request) {
      const userData = getTokenData(req)
      return await this.statRepository.find({
         relations: {
            position: true
         },
         where: {
            year: dto.year,
            categoryId: dto.categoryId,
            position: {
               id: dto.positionId,
               groupId: dto.groupId,
               group: {
                  locationId: dto.locationId,
                  roleRead: In(userData.userRoles || [])
               }
            }
         }
      })
   }

   async SetStaff(dto: Array<OUP_PostRequestDto> /*, req: Request*/) {
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
         const oup: Oup_Stat = {
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
               year: oup.year,
               categoryId: oup.categoryId,
               positionId: oup.positionId,
               month: oup.month
            }
         })) {
            // update.push(kpi)
            await this.statRepository.update({ year: oup.year, categoryId: oup.categoryId, positionId: oup.positionId, month: oup.month }, oup)
         }
         else {
            // insert.push(kpi)
            await this.statRepository.insert(oup)
         }
      }

      // await this.statRepository.upsert(upsert, ['date', 'productId'])
   }

   async EditPosition(dto: Partial<OUP_EditPosDto>) {
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
      else if (dto.groupId && dto.name.length > 0) {
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

   async RemovePosition(dto: Partial<OUP_EditPosDto>) {
      const pos = await this.positionRepository.findOne({
         where: {
            id: dto.id || -1
         }
      })
      if (pos) {
         await  this.statRepository.delete({
            positionId: pos.id
         })
         await this.positionRepository.remove(pos)
      }
   }

}
