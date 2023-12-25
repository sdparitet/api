import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";

import { KPIGroup } from './models/kpi-group.model';
import { KPIProduct } from './models/kpi-product.model';
import { KPIGetRequestDto } from './dto/get-request-dto';
import { KPI } from './models/kpi.model';
import { KPIPostRequestDto } from './dto/post-request-dto';
import { Op } from "sequelize";

@Injectable()
export class KpiService {
   constructor(
      @InjectModel(KPIGroup) private groupRepository: typeof KPIGroup,
      @InjectModel(KPIProduct) private productRepository: typeof KPIProduct,
      @InjectModel(KPI) private kpiRepository: typeof KPI,
   ) { }

   async up() {

      await this.productRepository.truncate()
      await this.groupRepository.truncate()

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
            {unit: '% технических простоев оборудования', name: 'Отсутствие технических простоев обоудования Цель не более 3%"'},
            {unit: '% своевременного выполнение заявок и ТЗ от КП и ОГТ', name: 'Выполнение заявок'},
            {unit: '% не проведнных ТО от запланированных в месяц', name: 'Соблюдение плана ТОиР Цель - 0 (2 допускается)"'},
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
         await this.groupRepository.create({ name: g })
            .then(async gres => {
               await this.productRepository.bulkCreate(groups[g].map(p => ({...p, group_id: gres.id})))
            })
      }
      return true
   }

   async getGroups() {
      return await this.groupRepository.findAll({ include: { all: true } })
   }

   async getGroup(dto: KPIGetRequestDto) {
      return await this.groupRepository.findOne({ where: { id: dto.group_id }, include: { all: true } })
   }

   async getKPI(dto: KPIGetRequestDto) {
      const group = await this.groupRepository.findOne({ where: { id: dto.group_id }, include: { all: true } })
      if (group) {
         return await this.kpiRepository.findAll({ where: { product: { [Op.in]: group.products.map(p => p.id) } }, include: { all: true } })
      }
      return []
   }

   async setKPI(dto: Array<KPIPostRequestDto>) {
      for (const k of dto) {
         await this.kpiRepository.upsert(k)
      }
   }

}
