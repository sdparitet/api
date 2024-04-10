import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Request } from 'express';

import { KPI_GetRequestDto } from './dto/get-request-dto';
import { KPI_PostRequestDto } from './dto/post-request-dto';
import { KPI_Group, KPI_Group_Dto } from "~kpi/entity/group.entity";
import { KPI_Product } from "~kpi/entity/product.entity";
import { KPI_Kpi } from '~kpi/entity/kpi.entity';
import { getTokenData } from '~root/src/apis/helpers';
import { KPI_Category, KPI_Category_Dto } from '~kpi/entity/category.entity';

@Injectable()
export class Kpi_Service {
   constructor(
      @InjectRepository(KPI_Category)
      private categoryRepository: Repository<KPI_Category>,
      @InjectRepository(KPI_Group)
      private groupRepository: Repository<KPI_Group>,
      @InjectRepository(KPI_Product)
      private productRepository: Repository<KPI_Product>,
      @InjectRepository(KPI_Kpi)
      private kpiRepository: Repository<KPI_Kpi>,
   ) { }

   async up() {
      const groups = {
         'Финансы': [
            {unit: 'тыс. рублей', name: 'Общие затраты на ремонт и обслуживание оборудования в месяц'},
            {unit: 'тыс. рублей', name: 'ФОТ СПП'},
            {unit: 'Отклонения от месячного бюджета службы', name: 'Выполнение месячного бюджета службы'},
            {unit: 'Отклонения от  годового инвест бюджета', name: 'Выполнение годового инвест бюджета'},
         ],
         'Рынок': [
            {unit: 'тыс. рублей', name: 'Затраты на внешние заказы контрагентов'},
         ],
         'Бизнес процессы': [
            {unit: '% технических простоев оборудования', name: 'Отсутствие технических простоев обоудования Цель не более 3%'},
            {unit: '% своевременного выполнение заявок и ТЗ от КП и ОГТ', name: 'Выполнение заявок'},
            {unit: '% не проведнных ТО от запланированных в месяц', name: 'Соблюдение плана ТОиР Цель - 0 (2 допускается)'},
            {unit: 'Наличие нарушений по результатам аудитов, их кол-во или оценка за аудит', name: 'Отсутствие замечаний по внутренним аудитем'},
         ],
         'Безопсность': [
            {unit: 'Колличество замечаний/повторных/неустраненных', name: 'Культура производства'},
            {unit: 'Отсутствие производственных травм', name: 'Производственный травматизм'},
            {unit: 'Отсутствие нарушений по пожарной безопасности', name: 'Пожарная безопасность'},
         ],
         'Сотрудники': [
            {unit: ' ', name: 'Укомплектованность штата'},
            {unit: ' ', name: '% текучести кадров в СПП'},
            {unit: ' ', name: '% сотрудников повысивших квалификацию за год (освоение нового оборуд или смежной проф)'},
            {unit: 'тыс. рублей', name: 'Эффективность человеческих ресурсов службы на единицу оборудования'},
         ]
      }

      for (const g of Object.keys(groups)) {
         await this.groupRepository.save(this.groupRepository.create({ name: g, products: groups[g] }))
      }
      return true
   }

   async getCategories(req: Request) {
      const userData = getTokenData(req)
      return (await this.categoryRepository.find({
         where: [
            { roleRead: In(userData.userRoles || []) },
         ]
      })).map(g => ({
         ...g,
         read: (userData.userRoles || []).includes(g.roleRead),
      } as KPI_Category_Dto))
   }

   async getGroups(req: Request) {
      const userData = getTokenData(req)
      return (await this.groupRepository.find({
         where: [
            { roleRead: In(userData.userRoles || []) },
            { roleWrite: In(userData.userRoles || []) }
         ], relations: { category: true }
      })).map(g => ({
         ...g,
         read: (userData.userRoles || []).includes(g.roleRead),
         write: (userData.userRoles || []).includes(g.roleWrite),
      } as KPI_Group_Dto))
   }

   async getKPI(dto: KPI_GetRequestDto, req: Request) {
      const userData = getTokenData(req)
      const group = await this.groupRepository.findOne({
         where: {
            id: dto.group_id,
            roleRead: In(userData.userRoles || [])
         }
      })
      if (group) {
         return await this.productRepository.find({where: {group: group}, relations: {kpis: true}})
      }
      return []
   }

   async setKPI(dto: Array<KPI_PostRequestDto>, req: Request) {
      const userData = getTokenData(req)

      for (const k of dto) {
         const kpi = new KPI_Kpi()
         kpi.id = k.id >= 0 ? k.id : undefined
         kpi.date = k.date
         kpi.value = k.value
         const product = await this.productRepository.findOne({ where: {id: k.product}, relations: { group: true } })
         const group = await this.groupRepository.findOne({
            where: {
               id: product.group.id,
               roleWrite: In(userData.userRoles || [])
            },
            relations: {
               category: true
            }
         })
         if (!group) {
            return req.res.status(403).json({status: 403, message: 'Недостаточно прав на запись'})
         }
         kpi.product = product

         if (await this.kpiRepository.exists({
            where: {
               date: kpi.date,
               product: kpi.product
            }
         })) {
            // update.push(kpi)
            await this.kpiRepository.update({ date: kpi.date, product: kpi.product }, kpi)
         }
         else {
            // insert.push(kpi)
            await this.kpiRepository.insert(kpi)
         }
      }

      // await this.kpiRepository.upsert(upsert, ['date', 'productId'])
   }

}
