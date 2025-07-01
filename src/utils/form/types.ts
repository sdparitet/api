import { ManipulateType } from 'dayjs'
import { ISearch } from '~connectors/glpi/types'


/**
 * @param {number} id
 * @param {string} title
 * @param {string} description
 * @param {IBlock[]} blocks
 */
export interface IForm {
   id: number
   title: string
   description: string | null
   blocks: IBlock[]
}


/**
 * @param {number} id
 * @param {string} title
 * @param {number} order
 * @param {IField[]} fields
 * @param {PropertyConditions | null} conditions
 */
export interface IBlock {
   id: number
   title: string
   order: number
   fields: IField[]
   conditions: PropertyConditions | null
}


/**
 * @param {number} id
 * @param {string} title
 * @param {string | null} description
 * @param {FieldTypeEnum} type
 * @param {number} order
 * @param {number | string | null | []} default_value
 * @param {IFieldData | null} data
 * @param {PropertyConditions | null} conditions
 * @param {boolean} required
 */
export interface IField {
   id: number
   title: string
   description: string | null
   type: FieldTypeEnum
   order: number
   required: boolean
   default_value: number | string | string[] | number[] | null
   data: IFieldData | null
   conditions: PropertyConditions | null
}


//region [ Conditions ]
export type PropertyConditions = { [key in PropertiesEnum]?: ComponentCondition | null }
export type ComponentCondition = { [key in Exclude<ComponentsEnum, ComponentsEnum.BLOCKS>]?: (ICondition | IConditionGroup)[] | null }


export enum PropertiesEnum {
   // noinspection JSUnusedGlobalSymbols
   VISIBLE = 'visible',
   REQUIRED = 'required',
   DISABLE = 'disable',
}


export enum ComponentsEnum {
   // noinspection JSUnusedGlobalSymbols
   BLOCKS = 'blocks',
   FIELDS = 'fields',
}


/**
 * @param {LogicExpressionEnum} logic
 * @param {IConditionGroup[] | ICondition[]} conditions
 */
export interface IConditionGroup {
   logic: LogicExpressionEnum
   conditions: IConditionGroup[] | ICondition[]
}


export enum LogicExpressionEnum {
   // noinspection JSUnusedGlobalSymbols
   AND = 'AND',
   OR = 'OR',
   NAND = 'NAND',
   NOR = 'NOR',
   NOT = 'NOT'
}


/**
 * @param {number} leftValue
 * @param {number | string | null | RegExp} rightValue
 * @param {OperatorsEnum} operator
 */
export interface ICondition {
   leftValue: number
   rightValue: number | string | null | RegExp
   operator: OperatorsEnum
}


/**
 * - `EQ`      — equal (`=`)
 * - `NEQ`     — not equal (`!=`)
 * - `GT`      — greater than (`>`)
 * - `LT`      — less than (`<`)
 * - `GTE`     — greater than or equal (`>=`)
 * - `LTE`     — less than or equal (`<=`)
 * - `IN`      — Included in a list of values
 * - `NIN`     — Not included in a list of values
 * - `REGEX`   — Matches a regular expression
 * - `NREGEX`  — Not matches a regular expression
 * - `TRUTHY`  — Evaluates as truthy (non-falsy)
 * - `FALSY`   — Evaluates as falsy (false, 0, "", null, undefined, NaN)
 */
export enum OperatorsEnum {
   // noinspection JSUnusedGlobalSymbols
   /** Equal (`=`) */
   EQ = 'EQ',
   /** Not equal (`!=`) */
   NEQ = 'NEQ',
   /** Greater than (`>`) */
   GT = 'GT',
   /** Less than (`<`) */
   LT = 'LT',
   /** Greater than or equal (`>=`) */
   GTE = 'GTE',
   /** Less than or equal (`<=`) */
   LTE = 'LTE',
   /** Included in a list */
   IN = 'IN',
   /** Not included in a list */
   NIN = 'NIN',
   /** Matches regular expression */
   REGEX = 'REGEX',
   /** Not matches regular expression */
   NREGEX = 'NREGEX',
   /** Evaluates as truthy */
   TRUTHY = 'TRUTHY',
   /** Evaluates as falsy */
   FALSY = 'FALSY',
}


//endregion


// region [ Field type&data ]
export enum FieldTypeEnum {
   // noinspection JSUnusedGlobalSymbols
   text = 'text',
   textarea = 'textarea',
   number = 'number',
   radio = 'radio',
   select = 'select',
   checkbox = 'checkbox',
   datetime = 'datetime',
   date = 'date',
   time = 'time',
   file = 'file'
}


export interface IFieldData {
   [FieldDataEnum.VALUES]?: IFieldDataValue[]
   [FieldDataEnum.DATASOURCE]?: IDataSource
   [FieldDataEnum.PROPERTIES]?: IFieldDataProperties
}


export enum FieldDataEnum {
   VALUES = 'values',
   DATASOURCE = 'datasource',
   PROPERTIES = 'properties',
}


export interface IFieldDataValue {
   label: string
   value: string | number
}


export enum SourceEnum {
   // noinspection JSUnusedGlobalSymbols
   GLPI = 'GLPI',
   LOCAL = 'LOCAL',
}


export interface IDataSource {
   source: SourceEnum
   item: string
   filters?: ISearch
   labelField: string
   valueField?: string
}


//region [ Properties ]
/**
 * @param {ISelectProperties?} select
 * @param {IDatetimeProperty?} datetime
 * @param {IFileProperties?} file
 */
export interface IFieldDataProperties {
   select?: ISelectProperties
   datetime?: IDatetimeProperty
   file?: IFileProperties
}


/**
 * @param {boolean?} multiple
 */
export interface ISelectProperties {
   multiple?: boolean
}


/**
 * @param {startHour?} HourType
 * @param {endHour?} HourType
 * @param {disablePast?} boolean
 * @param {disableFuture?} boolean
 * @param {disableToday?} boolean
 * @param {disableWeekends?} boolean
 * @param {disableHolidays?} boolean
 * @param {needShift?} boolean
 * @param {shiftType?} 'hour' | 'day' | 'week' | 'month' | 'year'
 * @param {shiftCount?} HourType
 * @param {thresholdHour?} HourType
 *
 * @param {boolean?} ampm
 * @param {boolean?} skipDisabled
 * @param {boolean?} displayWeekNumber
 * @param {number?} minuteStep
 * @param {string?} format
 * @param {string?} placeholder
 *
 * @description
 * `startHour` - Ограничение минимального часа для выбора
 *
 * `endHour` - Ограничение максимального часа для выбора
 *
 * `disablePast` - Запретить выбор прошедшего времени
 *
 * `disableFuture` - Запретить выбор будущего времени
 *
 * `disableToday` - Запретить выбор выходных
 *
 * `disableWeekends` - Запретить выбор праздничных дней
 *
 * `needShift` - Включает сдвиг минимально возможной даты/времени
 * после заданного часа (`thresholdHour`) на заданное количество времени (`shiftType` + `shiftCount`)
 *
 * `shiftType` - Тип добавляемого времени
 *
 * `shiftCount` - Количество времени для сдвига
 *
 * `thresholdHour` - Час начала сдвига
 *
 * `ampm` - Использовать ampm
 *
 * `skipDisabled` - Скрывать недоступное время
 *
 * `displayWeekNumber` - Показывать номер дня недели
 *
 * `minuteStep` - Шаг минут для выбора
 *
 * `format` - Формат отображения (DD.MM.YYYY HH:mm)
 *
 * `placeholder` - Placeholder для поля ввода
 */
export interface IDatetimeProperty {
   startHour?: HourType
   endHour?: HourType
   disablePast?: boolean
   disableFuture?: boolean
   disableToday?: boolean
   disableWeekends?: boolean
   disableHolidays?: boolean
   needShift?: boolean
   shiftType?: ManipulateType
   shiftCount?: HourType
   thresholdHour?: HourType

   ampm?: boolean
   skipDisabled?: boolean,
   displayWeekNumber?: boolean
   minuteStep?: number
   format?: string
   placeholder?: string
}


export type HourType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
   9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
   17 | 18 | 19 | 20 | 21 | 22 | 23 | 24


/**
 * @param {number?} maxSize
 * @param {number?} minSize
 * @param {number?} maxFiles
 * @param {boolean?} multiple
 * @param {{ [key: string]: [] }?} extraFileTypes
 */
export interface IFileProperties {
   maxSize?: number
   minSize?: number
   maxFiles?: number
   multiple?: boolean
   extraFileTypes?: { [key: string]: [] }
}


//endregion


//endregion

// ToDo Перенести
export type AnswerType = Record<string | number, string | number | (string | number)[] | null | undefined>

