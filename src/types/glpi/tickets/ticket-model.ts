import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ISearch } from '~t_c_glpi/types'


export enum TypeEnum {
   // noinspection JSUnusedGlobalSymbols
   'Инцидент' = 1,
   'Запрос' = 2,
}


export enum StatusEnum {
   // noinspection JSUnusedGlobalSymbols
   'Новая' = 1,
   'В работе' = 2,
   'Запланирована' = 3,
   'В ожидании' = 4,
   'Решена' = 5,
   'Закрыта' = 6,
}


export enum UrgencyEnum {
   // noinspection JSUnusedGlobalSymbols
   'Очень низкая' = 1,
   'Низкая' = 2,
   'Средняя' = 3,
   'Высокая' = 4,
   'Очень высокая' = 5,
}


export enum ValidationStatusEnum {
   // noinspection JSUnusedGlobalSymbols
   'Не требует согласования' = 1,
   'В ожидании' = 2,
   'Принято' = 3,
   'Отклонено' = 4,
}


export class BaseTicket {
   @ApiProperty()
   id: number
   @ApiProperty()
   type: TypeEnum
   @ApiProperty()
   title: string
   @ApiProperty()
   status: StatusEnum
}


export class Ticket {
   @ApiProperty()
   id: number
   @ApiProperty()
   title: string
   @ApiProperty()
   status: number
   @ApiProperty()
   type: number
   @ApiPropertyOptional()
   urgency?: number
   @ApiPropertyOptional()
   requestSource?: string | null
   @ApiPropertyOptional()
   location?: string | null
   @ApiPropertyOptional()
   category?: string | null
   @ApiPropertyOptional()
   content?: string | null
   @ApiPropertyOptional()
   dateCreation?: string | null
   @ApiPropertyOptional()
   dateModification?: string | null
   @ApiPropertyOptional()
   timeToResolve?: string | null
   @ApiPropertyOptional()
   timeIsUp?: string | null
   @ApiPropertyOptional()
   dateSolve?: string | null
   @ApiPropertyOptional()
   dateClose?: string | null
   @ApiPropertyOptional()
   author?: string | null
   @ApiPropertyOptional()
   lastUpdater?: string | null
   @ApiPropertyOptional()
   requesters?: string | string[] | null
   @ApiPropertyOptional()
   groupRequester?: string | string[] | null
   @ApiPropertyOptional()
   specialists?: string | string[] | null
   @ApiPropertyOptional()
   groupSpecialists?: string | string[] | null
   @ApiPropertyOptional()
   watchers?: string | string[] | null
   @ApiPropertyOptional()
   groupWatchers?: string | string[] | null
   @ApiPropertyOptional()
   solutionContent?: string | null
   @ApiPropertyOptional()
   solutionLastStatus?: number | null  // ToDo Make enum for solution statuses
   @ApiPropertyOptional()
   commentsCount?: number
   @ApiPropertyOptional()
   tasksCount?: number
   @ApiPropertyOptional()
   validationGlobalStatus?: ValidationStatusEnum | null
}


export enum TicketFieldEnum {
   // noinspection JSUnusedGlobalSymbols
   id = 2,                       // ID
   title = 1,                    // Заголовок
   status = 12,                  // Статус
   type = 14,                    // Тип
   urgency = 10,                 // Срочность
   requestSource = 9,            // Источник запроса
   location = 83,                // Местоположение
   category = 7,                 // Категория
   content = 21,                 // Описание
   dateCreation = 15,            // Дата открытия
   dateModification = 19,        // Последнее изменение
   timeToResolve = 18,           // Время до решения
   timeIsUp = 82,                // Время на решение истекло
   dateSolve = 17,               // Дата решения
   dateClose = 16,               // Дата закрытия
   author = 22,                  // Автор
   lastUpdater = 64,             // Последнее действие от
   requesters = 4,               // Инициатор запроса
   groupRequester = 71,          // Группа инициатора запроса
   specialists = 5,              // Специалист
   groupSpecialists = 8,         // Группа специалистов
   watchers = 66,                // Наблюдатель
   groupWatchers = 65,           // Группа наблюдателей
   solutionContent = 24,         // Решение
   solutionLastStatus = 25,      // Описание
   commentsCount = 27,           // Количество комментариев
   tasksCount = 28,              // Число задач
   validationGlobalStatus = 52,  // Статус глобального согласования
   validationStatus = 55,        // Статус согласования
   validationRequester = 58,     // Инициатор согласования
   validationValidator = 59,     // Согласующий
}


export const defaultTicketListCriteria: ISearch = {
   get_hateoas: false,
   order: 'DESC',
   filters: [],
}
export const defaultTicketListFields = [
   TicketFieldEnum.id,
   TicketFieldEnum.title,
   TicketFieldEnum.status,
   TicketFieldEnum.type,
]

// ToDo Move
export const keyMap = (records: Record<string, any>[]): Record<string, any> => {
   const map = Object.fromEntries(
      Object.entries(TicketFieldEnum)
      .filter(([k, v]) => typeof v === 'string')
      .map(([v, k]) => [v, k]),
   )

   return records.map(record =>
      Object.fromEntries(Object.entries(record).map(([k, v]) => [map[k] || k, v])),
   )
}
