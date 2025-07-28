import {
   ICondition,
   IConditionGroup,
   LogicExpressionEnum,
   OperatorsEnum,
} from '~t_u_forms/types'


const testCondition = (value: any, condition: ICondition): boolean => {
   if (value == null) {
      return condition.operator === OperatorsEnum.TRUTHY
         ? !!value
         : condition.operator === OperatorsEnum.FALSY
            ? !value
            : false
   }

   if (typeof value === 'symbol' || typeof value === 'bigint') return false

   const operator = Array.isArray(value) ? OperatorsEnum.IN : condition.operator
   const right = condition.rightValue
   const parsed = Number(value)
   const isNumberComparison = !isNaN(parsed)
   const left = isNumberComparison ? parsed : value


   switch (operator) {
      case OperatorsEnum.EQ:
         return left === right
      case OperatorsEnum.NEQ:
         return left !== right
      case OperatorsEnum.GT:
         return value > right
      case OperatorsEnum.LT:
         return value >= right
      case OperatorsEnum.GTE:
         return value >= right
      case OperatorsEnum.LTE:
         return value <= right
      case OperatorsEnum.IN:
         return Array.isArray(value) && value.includes(right)
      case OperatorsEnum.NIN:
         return Array.isArray(value) && !value.includes(right)
      case OperatorsEnum.REGEX:
         let pattern: RegExp | null = null

         if (typeof right === 'string') {
            const match = right.match(/^\/(.+)\/([gimsuy]*)?$/)
            if (match) {
               try {
                  pattern = new RegExp(match[1], match[2] || '')
               } catch (e) {
                  console.error('Failed to parse RegExp from string', e)
                  return false
               }
            } else {
               console.error('Invalid RegExp string format:', right)
               return false
            }
         } else if (right instanceof RegExp) {
            pattern = right
         }

         if (!pattern) return false
         return typeof value === 'string' && pattern.test(value)
      default:
         return false
   }
}

const isConditionGroup = (obj: ICondition | IConditionGroup): obj is IConditionGroup => {
   return 'logic' in obj && 'conditions' in obj
}

const applyLogicGroup = (
   evaluate: (condition: ICondition | IConditionGroup) => boolean,
   group: IConditionGroup,
): boolean => {
   const result = group.conditions.map(evaluate)

   switch (group.logic) {
      case LogicExpressionEnum.AND:
         return result.every(Boolean)
      case LogicExpressionEnum.OR:
         return result.some(Boolean)
      case LogicExpressionEnum.NAND:
         return !result.every(Boolean)
      case LogicExpressionEnum.NOR:
         return !result.some(Boolean)
      case LogicExpressionEnum.NOT:
         return !result[0]
      default:
         throw new Error(`Unknown logic expression: ${group.logic}`)
   }
}


export class ConditionEvaluator<T extends Record<string, any>> {
   constructor(private getValue: (item: T, key: string) => any) {
   }

   private evaluateCondition(item: T, condition: ICondition | IConditionGroup): boolean {
      if (isConditionGroup(condition)) {
         return applyLogicGroup(sub => this.evaluateCondition(item, sub), condition)
      }
      const value = this.getValue(item, String(condition.leftValue))
      return testCondition(value, condition)
   }

   validate(item: T, conditions: (ICondition | IConditionGroup)[]): boolean {
      return conditions.map(condition => this.evaluateCondition(item, condition)).every(Boolean)
   }

   filter(items: T[], conditions: (ICondition | IConditionGroup)[]): T[] {
      return items.filter((item) => this.validate(item, conditions))
   }
}



