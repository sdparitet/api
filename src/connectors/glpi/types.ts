export type PayloadType ={
    [key: string]: number | string
}

export interface ISearch {
    criteria: CriteriaType[]
    forcedisplay?: number[]
    sort?: number
    order?: 'ASC' | 'DESC'
}

export type CriteriaType = {
    link?: 'AND' | 'OR'
    field?: number
    searchtype?: 'contains' | 'equals' | 'equal' | 'not equals' | 'less than' | 'morethan' | 'under' | 'notunder'
    value?: string | number
    criteria?: CriteriaType[]
}

export type GlpiApiResponse = Promise<{ status: number, data: any }>