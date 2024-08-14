import {AxiosResponse} from "axios";
import {InjectDataSource} from "@nestjs/typeorm";
import {GLPI_DB_CONNECTION} from "~root/src/constants";
import {DataSource} from "typeorm";
import {ISearch, GlpiApiResponse, PayloadType, CriteriaType} from "~connectors/glpi/types";
import {HttpStatus} from "@nestjs/common";
import * as http from "node:http";
import * as https from "node:https";


export class GLPI {
    private session = require('axios')

    private readonly _baseUrl = process.env.GLPI_API_URL || 'https://sd.paritet.su/apirest.php/'
    private readonly _appToken = process.env.GLPI_API_TOKEN || ''
    private _username: string
    private _userToken: string
    userId: number
    userFIO: string
    sessionToken: string
    authorized: boolean

    constructor(username: string, @InjectDataSource(GLPI_DB_CONNECTION) private readonly glpi: DataSource) {
        return (async (): Promise<GLPI> => {
            this._username = username

            this.session.defaults.validateStatus = (status: number) => status >= 200 && status < 500
            this.session.defaults.httpAgent = new http.Agent({keepAlive: true})
            this.session.defaults.httpsAgent = new https.Agent({keepAlive: true})
            this.session.defaults.timeout = 10000
            this.session.defaults.baseURL = this._baseUrl
            this.session.defaults.headers.common = {
                'User-Agent': 'Mozilla/5.0',
                'Content-Type': 'application/json',
                'App-Token': this._appToken,
            }

            this._userToken = await this._GetUserToken()

            const res = await this._InitSession()

            if (res.status === HttpStatus.OK) {
                this.authorized = true
                this.userId = res.data.session.glpiID
                this.userFIO = res.data.session.glpifriendlyname
                this.sessionToken = res.data.session_token
                this.session.defaults.headers.common['Session-Token'] = this.sessionToken
            } else {
                this.authorized = false
            }

            return this
        })() as unknown as GLPI
    }

    private async _GetUserToken() {
        const ret: { api_token: string }[] = await this.glpi.query(`
            select api_token
            from glpi_users
            where name = '${this._username}'`)

        return ret && ret.length > 0 && ret[0].api_token !== null ? ret[0].api_token : await this._SetUserToken()
    }

    private async _GenerateUserToken() {
        const length = 40
        const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
        let token = ''

        for (let i = 0; i < length; i++) {
            token += charset[Math.floor(Math.random() * charset.length)]
        }

        return token
    }

    private async _SetUserToken() {
        const token = await this._GenerateUserToken()

        await this.glpi.query(`
            update glpi_users
            set api_token = '${token}'
            where name = '${this._username}'`
        )

        return token
    }

    private async _InitSession(): GlpiApiResponse {
        const auth_header = {
            'Authorization': 'user_token ' + this._userToken
        }

        const {status, data} = await this.session.get('initSession', {
            headers: auth_header,
            params: {get_full_session: true}
        })
        return {status, data}
    }

    async KillSession() {
        return this.session.get('killSession')
    }

    async GetItem(itemType: string, itemId: number, retries: number = 3): GlpiApiResponse {
        try {
            const {status, data} = await this.session.get(`${itemType}/${itemId}`)
            return {status: status === HttpStatus.UNAUTHORIZED ? HttpStatus.BAD_REQUEST : status, data: data}
        } catch (err: any) {
            console.log(err)
            if (retries > 0) {
                return await this.GetItem(itemType, itemId, retries - 1)
            }
            else return {status: HttpStatus.INTERNAL_SERVER_ERROR, data: err}
        }
    }

    async GetAllItems(itemType: string): GlpiApiResponse {
        console.log(itemType)
        const allData = []
        let left = 0
        const step = 200

        do {
            const right = left + step - 1
            const {status, data, headers} = await this.session.get(itemType, {
                params: {'range': `${left}-${right}`}
            })

            if (status === HttpStatus.UNAUTHORIZED) {
                return {status: HttpStatus.BAD_REQUEST, data: data}
            }

            allData.push(...data)

            if (status === 206) {
                const contentRange = headers['content-range']
                const [range, total] = contentRange.split('/')
                const [, end] = range.split('-')

                left = parseInt(end) + 1

                if (left >= total) {
                    break;
                }
            } else {
                break
            }
        } while (true)

        return {status: HttpStatus.OK, data: allData}
    }

    async GetUserId(username: string): Promise<number> {
        const criteria: ISearch = {
            criteria: [
                {
                    field: 1,
                    searchtype: 'equal',
                    value: username,
                },
            ],
            forcedisplay: [2],
        }

        const {status, data} = await this.Search('User', criteria)
        return status === HttpStatus.OK ? data['data'] ? data['data'][0]['2'] : 0 : 0
    }

    private async _AddCriteria(criteria: CriteriaType[], parent: string = '') {
        const _criteria = []

        const prefix = parent === '' ? 'criteria' : `${parent}[criteria]`

        for (const [index, criterion] of criteria.entries()) {
            if (criterion.criteria) {
                _criteria.push({[`${prefix}[${index}][link]`]: criterion.link ? criterion.link : 'AND'})
                _criteria.push(...await this._AddCriteria(criterion.criteria, `criteria[${index}]`))
            } else {
                criterion.link && _criteria.push({[`${prefix}[${index}][link]`]: criterion.link})
                _criteria.push({[`${prefix}[${index}][field]`]: criterion.field})
                _criteria.push({[`${prefix}[${index}][searchtype]`]: criterion.searchtype})
                _criteria.push({[`${prefix}[${index}][value]`]: criterion.value})
            }
        }

        return _criteria
    }

    async Search(itemType: string, searchData: ISearch) {
        const rawParams = []
        searchData.sort && rawParams.push(searchData.sort)
        searchData.order && rawParams.push(searchData.order)
        searchData.criteria && rawParams.push(...await this._AddCriteria(searchData.criteria))
        searchData.forcedisplay && rawParams.push(...searchData.forcedisplay.map((fieldId, index) => ({
            [`forcedisplay[${index}]`]: fieldId
        })))

        const flatParams = Object.assign({}, ...rawParams);
        const params = `?${Object.keys(flatParams).map(key => `${key}=${flatParams[key]}`).join('&')}`

        const {status, data} = await this.session.get('search/' + itemType + params)
        return {status: status === HttpStatus.UNAUTHORIZED ? HttpStatus.BAD_REQUEST : status, data: data}
    }

    async AddItems(itemType: string, payload: PayloadType | PayloadType[], retries: number = 3): GlpiApiResponse {

        const _payload = {
            input: payload
        }
        try {
            const ret = await this.session.post(itemType, _payload)
            const {status, data} = ret
            return {status, data}
        } catch (err: any) {
            if (retries > 0) {
                return await this.AddItems(itemType, payload, retries - 1)
            }
            else return {status: HttpStatus.INTERNAL_SERVER_ERROR, data: err}
        }
    }

    async UpdateItem(itemType: string, payload: PayloadType | PayloadType[]): GlpiApiResponse {
        const _payload = {
            input: payload
        }

        const {status, data} = await this.session.put(itemType, _payload)
        return {status: status === HttpStatus.UNAUTHORIZED ? HttpStatus.BAD_REQUEST : status, data: data}
    }

    async CreateFollowup(ticketId: number, text: string): GlpiApiResponse {
        const payload: PayloadType = {
            itemtype: 'Ticket',
            items_id: ticketId,
            users_id: this.userId,
            content: text,
        }

        return await this.AddItems('ITILFollowup', payload)
    }

    async SwitchTicketNotification(ticketId: number, state: 0 | 1): GlpiApiResponse {
        const criteria: ISearch = {
            criteria: [
                {
                    field: 3,
                    searchtype: 'equals',
                    value: ticketId,
                },
                {
                    link: 'AND',
                    field: 4,
                    searchtype: 'equals',
                    value: this.userId,
                },
            ],
            forcedisplay: [2],
        }

        const {status, data} = await this.Search('Ticket_User', criteria)

        if (status === HttpStatus.OK || status === HttpStatus.PARTIAL_CONTENT) {
            const payload: PayloadType[] = data.data.map((record: any) => ({
                id: record['2'],
                use_notification: state
            }))

            return await this.UpdateItem('Ticket_User', payload)
        } else {
            return {status: status === HttpStatus.UNAUTHORIZED ? HttpStatus.BAD_REQUEST : status, data: data}
        }
    }

    async UploadDocument(files: Express.Multer.File[]): GlpiApiResponse {
        const FormData = require('form-data')
        const form = new FormData()

        form.append('uploadManifest', JSON.stringify({
            input: files.map(file => {
                return {
                    name: decodeURIComponent(file.originalname),
                    _filename: [decodeURIComponent(file.originalname)]
                }
            })
        }))

        files.forEach((file) => {
            form.append(decodeURIComponent(file.originalname), file.buffer, decodeURIComponent(file.originalname))
        })

        const {status, data} = await this.session.post('Document', form, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...form.getHeaders()
            }
        })
        return {status: status === HttpStatus.UNAUTHORIZED ? HttpStatus.BAD_REQUEST : status, data: data}
    }

    async UploadTicketDocument(files: Express.Multer.File[], ticketId: number, asUser: string | null = null) {
        const {status, data} = await this.UploadDocument(files)

        const userId = asUser === null ? this.userId : await this.GetUserId(asUser)

        const payload: PayloadType = data.map((file: any) => ({
            documents_id: file.id,
            itemtype: 'Ticket',
            items_id: ticketId,
            users_id: userId,
        }))

        const {status: foo, data: bar} = await this.AddItems('Document_Item', payload)

        console.log(foo)
        console.log(bar)

        return {
            status: status,
            ticket_id: ticketId,
            data: data
        }
    }

    async DownloadDocument(docId: number) {
        const headers = {
            'Accept': 'application/octet-stream',
        }
        return await this.session.get(`Document/${docId}`, {
            headers: headers,
            responseType: 'arraybuffer'
        }).then((response: AxiosResponse) => {
            const mime = response.headers['content-type']
            const {data, status} = response
            return {
                status: status === HttpStatus.UNAUTHORIZED ? HttpStatus.BAD_REQUEST : status,
                data: data,
                mime: mime
            }
        })
    }

    async GetUserPicture(userId: number) {
        const {status, data} = await this.session.get(`User/${userId}/Picture`)
        return {status: status === HttpStatus.UNAUTHORIZED ? HttpStatus.BAD_REQUEST : status, data: data}
    }
}