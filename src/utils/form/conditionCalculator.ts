import { AnswerType, ICondition, IConditionGroup, LogicExpressionEnum, OperatorsEnum } from '~utils/form/types'


export class ConditionCalculator {
   private readonly data: AnswerType

   constructor(data: AnswerType) {
      this.data = data
   }

   private isConditionGroup = (obj: ICondition | IConditionGroup) => {
      return 'logic' in obj && 'conditions' in obj
   }

   private calculateCondition = (condition: ICondition): boolean => {
      const fieldValue = this.data[condition.leftValue]
      if (fieldValue === undefined || fieldValue === null) {
         switch (condition.operator) {
            case OperatorsEnum.TRUTHY:
               return !!fieldValue
            case OperatorsEnum.FALSY:
               return !fieldValue
            default:
               return false
         }
      } else {
         if (typeof fieldValue === 'symbol' || typeof fieldValue === 'bigint') return false

         let operator = condition.operator
         if (Array.isArray(fieldValue)) operator = OperatorsEnum.IN

         switch (operator) {
            case OperatorsEnum.EQ:
            case OperatorsEnum.NEQ:
               const parsed = Number(fieldValue)
               const isNumberComparison = !isNaN(parsed)
               const left = isNumberComparison ? parsed : fieldValue
               const right = condition.rightValue
               return operator === OperatorsEnum.EQ
                  ? left === right
                  : left !== right
            case OperatorsEnum.GT:
               return fieldValue > condition.rightValue
            case OperatorsEnum.LT:
               return fieldValue >= condition.rightValue
            case OperatorsEnum.GTE:
               return fieldValue >= condition.rightValue
            case OperatorsEnum.LTE:
               return fieldValue <= condition.rightValue
            case OperatorsEnum.IN:
               return Array.isArray(fieldValue)
                  ? fieldValue.some((v: string | number) => v === condition.rightValue)
                  : false
            case OperatorsEnum.NIN:
               return Array.isArray(fieldValue)
                  ? !fieldValue.some((v: string | number) => v === condition.rightValue)
                  : false
            case OperatorsEnum.REGEX:
               if (condition.rightValue instanceof RegExp) {
                  return typeof fieldValue === 'string'
                     ? condition.rightValue.test(fieldValue)
                     : false
               } else {
                  console.error('Invalid RegExp in condition')  // ToDo сделать обработку ошибки
                  return false
               }
            default:
               return false
         }
      }
   }

   private calculateSubConditions = (group: IConditionGroup): boolean => {
      const logicExpression = group.logic

      const result: boolean[] = group.conditions.map((condition: ICondition | IConditionGroup) => {
         if (this.isConditionGroup(condition)) {
            return this.calculateSubConditions(condition)
         } else {
            return this.calculateCondition(condition)
         }
      })

      switch (logicExpression) {
         case LogicExpressionEnum.AND:
            return result.every(Boolean)
         case LogicExpressionEnum.OR:
            return result.some(Boolean)
         case LogicExpressionEnum.NAND:
            return !result.every(Boolean)
         case LogicExpressionEnum.NOR:
            return !result.some(Boolean)
         case LogicExpressionEnum.NOT:
            return !result
         default:
            throw new Error(`Unknown logic expression: ${logicExpression}`)  // ToDo сделать обработку ошибки
      }
   }

   validate(conditions: (ICondition | IConditionGroup)[]) {
      return conditions.map(condition => {
         if (this.isConditionGroup(condition)) return this.calculateSubConditions(condition)
         else return this.calculateCondition(condition)
      }).every(Boolean)
   }
}




