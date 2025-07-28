export enum ShowRule {
    VISIBLE_UNTIL = 1,
    HIDDEN_UNTIL = 2,
    DISABLE_UNTIL = 3,
    ENABLE_UNTIL = 4,
    REQUIRED_UNTIL = 5,
    NOT_REQUIRED_UNTIL = 6,
}

export enum FilterCompareType {
    EQUAL = 1,
    NOT_EQUAL = 2,
    LESS_THAN = 3,
    LESS_OR_EQUAL_THAN = 4,
    MORE_THEN = 5,
    MORE_OR_EQUAL_THAN = 6,
    INCLUDES = 7,
    NOT_INCLUDES = 8,
    STARTS_WITH = 9,
    NOT_STARTS_WITH = 10,
    ENDS_WITH = 11,
    NOT_ENDS_WITH = 12,
}

export enum CompareType {
    EQUAL = 1,
    NOT_EQUAL = 2,
    LESS_THAN = 3,
    LESS_OR_EQUAL_THAN = 4,
    MORE_THEN = 5,
    MORE_OR_EQUAL_THAN = 6,
    VISIBLE = 7,
    INVISIBLE = 8,
    MATCH_REGEX = 9,
    NOT_MATCH_REGEX = 10,
}

export enum ConditionLogic {
    AND = 1,
    OR = 2,
    NOT = 3,
}

export type PayloadType = {
    [key: string]: number | string
}

export interface SingleFilter {
    type: FilterCompareType
    logic: ConditionLogic

    [key: string]: any
}

export interface CompositeFilter {
    logic: ConditionLogic,
    filters: Filter,
}

export type Filter = SingleFilter | CompositeFilter