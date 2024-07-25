import {HttpStatus, Inject, Injectable} from "@nestjs/common";
import {InjectDataSource, InjectRepository} from "@nestjs/typeorm";
import {FORMS_DB_CONNECTION, GLPI_DB_CONNECTION} from "~root/src/constants";
import {DataSource, In, Repository} from "typeorm";
import {CACHE_MANAGER} from "@nestjs/cache-manager";
import {Cache} from "cache-manager";
import {Response} from "express";
import {Form} from "~form/entity/form.entity";
import {GetConditionParams, GetFormsParams, RequestGlpiSelectDto} from "~form/dto/get-request-dto";
import {AnswerDto, CreateConditionDto, CreateFormDto} from "~form/dto/post-request-dto";
import {Block} from "~form/entity/block.entity";
import {Field, FieldType} from "~form/entity/field.entity";
import {Condition} from "~form/entity/condition.entity";
import {Template} from "~form/entity/template.entity";
import {CompareType, PayloadType} from "~form/types";
import {GLPI} from "~root/src/connectors/glpi/glpi-api.connector";

@Injectable()
export class Form_Service {
    constructor(
        @InjectDataSource(GLPI_DB_CONNECTION) private readonly glpi: DataSource,
        @Inject(CACHE_MANAGER) private cacheService: Cache,
        @InjectRepository(Form, FORMS_DB_CONNECTION)
        private formRep: Repository<Form>,
        @InjectRepository(Block, FORMS_DB_CONNECTION)
        private formBlockRep: Repository<Block>,
        @InjectRepository(Field, FORMS_DB_CONNECTION)
        private formFieldRep: Repository<Field>,
        @InjectRepository(Condition, FORMS_DB_CONNECTION)
        private conditionRep: Repository<Condition>,
        @InjectRepository(Template, FORMS_DB_CONNECTION)
        private templateRep: Repository<Template>,
    ) {
    }

    /**region [ Wrappers ] */
    async RequestWrapper(res: Response, func: () => void) {
        try {
            func()
        } catch (err: any) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err)
        }
    }

    async GlpiApiWrapper(username: string, dataSource: DataSource, res: Response, func: (glpi: GLPI) => void) {
        const glpi = await new GLPI(username, dataSource)
        if (glpi.authorized) {
            try {
                func(glpi)
            } catch (err: any) {
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err)
            } finally {
                // await glpi.kill_session()
            }
        } else {
            return res.status(HttpStatus.UNAUTHORIZED).json([])
        }
    }

    //endregion

    /**region [Form] */
    async GetForms(params: GetFormsParams, res: Response, id?: number) {
        await this.RequestWrapper(res, async () => {
            if (id) {
                const ret = (await this.formRep.find({
                    where: {
                        id: id,
                        is_active: In(params.show_inactive && params.show_inactive.toLowerCase() === 'true' ? [true, false] : [true])
                    },
                }))

                if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
                else res.status(HttpStatus.BAD_REQUEST).json([])
            } else {
                const queryBuilder = this.formRep.createQueryBuilder('form')
                    .select(['form.id', 'form.title', 'form.icon', 'form.description', 'form.is_active'])

                if (params.show_inactive && params.show_inactive.toLowerCase() === 'true') {
                    queryBuilder.where('form.is_active IN (:...isActive)', {isActive: [true, false]})
                } else {
                    queryBuilder.where('form.is_active = :isActive', {isActive: true})
                }

                const ret = await queryBuilder.getMany()

                if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
                else res.status(HttpStatus.BAD_REQUEST).json([])
            }
        })
    }

    async CreateForm(dto: CreateFormDto[], res: Response) {
        await this.RequestWrapper(res, async () => {
            if (dto.some(form => form.title === undefined)) {
                res.status(HttpStatus.BAD_REQUEST).json({status: 'error', message: 'title not provided'})
            } else {
                const forms: Form[] = []

                dto.map(form => {
                    const _form = new Form()
                    _form.title = form.title
                    _form.description = form.description ? form.description : null;
                    _form.is_active = form.is_active === undefined ? true : form.is_active
                    forms.push(_form)
                })

                const ret = await this.formRep.insert(forms)
                res.status(HttpStatus.CREATED).json(ret.identifiers.map(item => item.id))
            }
        })
    }

    //endregion

    /**region [Form block] */

    //endregion

    /**region [Form field] */
    async GetGlpiSelect(itemtype: string, params: RequestGlpiSelectDto, res: Response) {
        if (!itemtype || !params || !('username' in params) || !('value_field' in params)) {
            res.status(HttpStatus.BAD_REQUEST).json({status: 'error', message: 'itemtype or username not provided'})
        } else {
            await this.GlpiApiWrapper(params.username, this.glpi, res, async (glpi) => {
                const ret = await glpi.get_all_items(itemtype)
                const data = ret.data.map((item: any) => ({
                    value: item.id,
                    label: item[params.value_field],
                })).sort((a, b) => a.label < b.label ? -1 : 1)
                if (data && data.length > 0) res.status(ret.status).json(data)
                else res.status(HttpStatus.BAD_REQUEST).json([])
            })
        }
    }

    //endregion

    /**region [Condition] */
    async GetConditions(params: GetConditionParams, res: Response) {
        if (!!params.block_id !== !!params.field_id) {
            await this.RequestWrapper(res, async () => {
                const ret = await this.conditionRep.find({
                    where: [
                        !isNaN(Number(params.block_id)) && {target_block: {id: Number(params.block_id)}},
                        !isNaN(Number(params.field_id)) && {target_field: {id: Number(params.field_id)}},
                    ],
                    order: {order: "ASC"},
                    loadRelationIds: true
                })


                if (ret && ret.length > 0) res.status(HttpStatus.OK).json(ret)
                else res.status(HttpStatus.BAD_REQUEST).json([])
            })
        } else {
            res.status(HttpStatus.BAD_REQUEST).json({
                status: 'error',
                message: 'block_id or field_id not provided (one of)'
            })
        }
    }

    async CreateConditions(dto: CreateConditionDto[], res: Response) {
        await this.RequestWrapper(res, async () => {
            if (dto.some(condition => (
                condition.target_block_id === undefined
                && condition.target_field_id === undefined
                && condition.source_block_id === undefined
                && condition.source_field_id === undefined
            ) || (
                condition.target_block_id === undefined
                && condition.target_field_id === undefined
            ) || (
                condition.source_block_id === undefined
                && condition.source_field_id === undefined
            ))) {
                res.status(HttpStatus.BAD_REQUEST).json({
                    status: 'error',
                    message: 'target_block_id, target_field_id, source_block_id or source_field_id not provided'
                })
            } else {
                let lastConditionOrder = 0
                const conditions: Condition[] = await Promise.all(dto.map(async (condition) => {
                    const target = condition.target_block_id ? await this.formBlockRep.findOne({where: {id: condition.target_block_id}}) : await this.formFieldRep.findOne({where: {id: condition.target_field_id}})
                    const source = condition.source_block_id ? await this.formBlockRep.findOne({where: {id: condition.source_block_id}}) : await this.formFieldRep.findOne({where: {id: condition.source_field_id}})

                    lastConditionOrder = condition.order ? condition.order : lastConditionOrder
                    if (lastConditionOrder === 0) {
                        const lastCondition = await this.conditionRep.findOne({
                            where:
                                condition.target_block_id ? {
                                    target_block: target,
                                } : {
                                    target_field: target
                                },
                            order: {
                                order: 'DESC'
                            }
                        })

                        lastConditionOrder = lastCondition ? lastCondition.order + 1 : 1
                    }

                    if (target && source) {
                        const _condition = new Condition()
                        _condition.condition = condition.condition ? condition.condition : null
                        _condition.condition_value = condition.condition_value ? condition.condition_value : null
                        _condition.condition_logic = condition.condition_logic ? condition.condition_logic : null
                        _condition.order = lastConditionOrder
                        condition.target_block_id ?
                            _condition.target_block = target as Block
                            :
                            _condition.target_field = target as Field
                        _condition.source_field = source as Field
                        lastConditionOrder++
                        return _condition
                    }
                }))

                const ret = await this.formFieldRep.insert(conditions)
                res.status(HttpStatus.CREATED).json(ret.identifiers.map(item => item.id))
            }
        })
    }

    //endregion

    /**region [Answer] */
    async GlpiSelectReplacer(glpi: GLPI, fieldId: string, value: string): Promise<string> {
        const field = await this.formFieldRep.findOneBy({id: Number(fieldId)})
        console.log(field.id)
        console.log(field.values)
        if (field.type === FieldType.glpi_select) {
            const ret = await glpi.get_item(field.values[0].itemtype.toString(), Number(value))
            return ret.data[field.values[0].value_field]
        } else {
            field.values.map(values => {
                if (values.value.toString() === value) {
                    return values.label
                }
            })
        }
    }

    async Answer(dto: AnswerDto, res: Response) {
        await this.GlpiApiWrapper(dto.username, this.glpi, res, async (glpi) => {
            const form = await this.formRep.findOneBy({id: dto.form_id})

            const evaluateCondition = (left: string, right: string, compareType: CompareType) => {
                switch (compareType) {
                    case CompareType.EQUAL:
                        return left === right;
                    case CompareType.NOT_EQUAL:
                        return left !== right;
                    case CompareType.LESS_THAN:
                        return left < right;
                    case CompareType.MORE_THEN:
                        return left > right;
                    case CompareType.LESS_OR_EQUAL_THAN:
                        return left <= right;
                    case CompareType.MORE_OR_EQUAL_THAN:
                        return left >= right;
                }
            }

            const validTemplates: Template[] = []
            form.templates.forEach(template => {
                if (template.conditions.length > 0) {
                    template.conditions.forEach(condition => {
                        const leftValue = condition.left in dto.data ? dto.data[condition.left] : null
                        if (leftValue) {
                            const isMatch = evaluateCondition(String(leftValue), condition.right, condition.comparison_type)
                            isMatch && validTemplates.push(template)
                        }
                    })
                } else {
                    validTemplates.push(form.templates[0])
                }
            })

            const payloads: PayloadType[] = []
            for (const template of validTemplates) {
                const payload: PayloadType = {}
                for (const key in template.data) {
                    if (typeof template.data[key] === "string") {
                        const matches = [...template.data[key].matchAll(/(?<full>##q_(?<id>\d*)##)/g)]
                        let fieldValue = template.data[key]
                        for (const match of matches) {
                            if (match.groups.id in dto.data) {
                                fieldValue = fieldValue.replace(match.groups.full, dto.data[match.groups.id])
                            }
                        }

                        const glpiSelectMatches = [...template.data[key].matchAll(/(?<full>##sq_(?<id>\d*)##)/g)]
                        for (const match of glpiSelectMatches) {
                            if (match.groups.id in dto.data) {
                                fieldValue = fieldValue.replace(match.groups.full, await this.GlpiSelectReplacer(glpi, match.groups.id, dto.data[match.groups.id]))
                            }
                        }

                        payload[key] = fieldValue
                    } else {
                        payload[key] = template.data[key]
                    }
                }

                payloads.push(payload)
            }

            const ret = await glpi.add_items('Ticket', payloads)
            if ([201, 207].includes(ret.status)) {
                res.status(ret.status).json(ret.data)
            } else {
                res.status(ret.status).json({id: ret.data[0], message: ret.data[1]})
            }
        })
    }

    //endregion

}