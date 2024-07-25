export enum ShowRule {
    VISIBLE_UNTIL = 1,
    HIDDEN_UNTIL = 2,
    DISABLE_UNTIL = 3,
    ENABLE_UNTIL = 4,
    REQUIRED_UNTIL = 5,
    NOT_REQUIRED_UNTIL = 6,
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
}

export type PayloadType ={
    [key: string]: number | string
}