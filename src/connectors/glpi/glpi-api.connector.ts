import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { HttpStatus } from '@nestjs/common'
import { DataSource } from 'typeorm'
import * as https from 'node:https'
import * as http from 'node:http'
import { Helper } from '~c_glpi/helper'
import {
   ContentRange,
   ICriteriaType,
   GlpiApiInitResponse,
   GlpiApiResponse,
   IGlpiSession,
   ISearch,
   PayloadType,
} from '~t_c_glpi/types'
import { ApiProperty } from '@nestjs/swagger'
import { UrgencyEnum } from '~t_tickets/ticket-model'


export class GLPI {
   private session: AxiosInstance
   private readonly _baseUrl = process.env.GLPI_API_URL || 'https://sd.paritet.su/apirest.php/'
   private readonly _appToken = process.env.GLPI_API_TOKEN || ''
   private readonly _username: string
   private _userToken: string
   sessionInfo: IGlpiSession
   userId: number
   userFio: string
   sessionToken: string
   authorized: boolean = false

   constructor(username: string, private readonly glpi: DataSource) {
      this._username = username
      this.session = this._InitAxios()
   }

   private _InitAxios(): AxiosInstance {
      return axios.create({
         baseURL: this._baseUrl,
         timeout: 10000,
         httpAgent: new http.Agent({ keepAlive: true }),
         httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: false }),
         headers: {
            'User-Agent': 'Mozilla/5.0',
            'Content-Type': 'application/json',
            'App-Token': this._appToken,
         },
         validateStatus: (status: number) => status >= 200 && status < 500,
      })
   }

   async InitSession(): Promise<void> {
      this._userToken = await this._GetUserToken()

      if (this._userToken) {
         const { status, data } = await this._Login(this._userToken)
         if (status === HttpStatus.OK) {
            this.sessionInfo = data
            this.authorized = true
            this.userId = data.session.glpiID
            this.userFio = data.session.glpifriendlyname
            this.sessionToken = data.session_token
            this.session.defaults.headers.common['Session-Token'] = this.sessionToken
         }
      }
   }

   private async _Login(token: string): Promise<GlpiApiInitResponse> {
      try {
         const { status, data } = await this.session.get('initSession', {
            headers: { 'Authorization': `user_token ${token}`, 'Cache-Control': 'no-cache' },
            params: { get_full_session: true },
         })

         return { status, data }

      } catch (error) {
         return { status: HttpStatus.INTERNAL_SERVER_ERROR, data: error }
      }
   }

   private async _GetUserToken(asUser: string = this._username): Promise<string | null> {
      const [ret] = await this.glpi.query(`
         select api_token
         from glpi_users
         where name = '${asUser}'`)

      return ret?.api_token ?? await this._SetUserToken(asUser)
   }

   private async _SetUserToken(asUser: string): Promise<string> {
      const token = this._GenerateUserToken()
      await this.glpi.query(`
         update glpi_users
         set api_token = '${token}'
         where name = '${asUser}'`)
      return token
   }

   private _GenerateUserToken() {
      const length = 40
      const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
      return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('')
   }

   async KillSession() {
      return this.session.get('killSession')
   }

   async GetUserRights(asUser: string = this._username, sessionInfo: IGlpiSession = this.sessionInfo) {
      if (asUser !== this._username) {
         const token = await this._GetUserToken(asUser)
         if (token) {
            const { status, data } = await this._Login(token)
            if (status === HttpStatus.OK) {
               sessionInfo = data
            } else {
               return null
            }
         } else {
            return null
         }
      }
      const helper = new Helper(sessionInfo)
      return {
         glpiId: this.userId,
         ...await helper.getRights(),
      }
   }

   private async _HandleRequest<T>(request: Promise<AxiosResponse<T>>, retries: number = 3): Promise<GlpiApiResponse> {
      try {
         const { status, data, headers, request: r } = await request
         return { status, data, headers }
      } catch (err) {
         if (retries > 0) {
            console.log(err)
            return this._HandleRequest(request, retries - 1)
         } else {
            return { status: HttpStatus.INTERNAL_SERVER_ERROR, data: err, headers: {} }
         }
      }
   }

   async GetItem(itemType: string, itemId: number, params: PayloadType = {}): Promise<GlpiApiResponse> {
      return this._HandleRequest(this.session.get(`${itemType}/${itemId}`, { params: params }))
   }

   async GetAllItems(itemType: string, params: PayloadType = {}): Promise<GlpiApiResponse> {
      const { status, data, headers } = await this._HandleRequest(this.session.get(itemType, { params: params }))

      if (status === HttpStatus.PARTIAL_CONTENT) {
         const contentRangeHeader = headers['content-range'] || headers['Content-Range']
         const { data: _data, rawData } = await this._PartialReader(itemType, params, data, contentRangeHeader)
         return {
            status: HttpStatus.OK,
            data: _data,
            rawData: _data,
         }
      } else {
         return { status, data }
      }
   }

   async GetUserId(username: string): Promise<number> {
      const criteria: ISearch = {
         filters: [{ field: 1, searchtype: 'contains', value: `^${username}$` }],
         forcedisplay: [2],
      }

      const { status, data } = await this.Search('User', criteria)
      return status === HttpStatus.OK ? data['data'] ? data['data'][0]['2'] : 0 : 0
   }

   async GetUserFio(username: string): Promise<string> {
      const criteria: ISearch = {
         filters: [{ field: 1, searchtype: 'contains', value: `^${username}$` }],
         forcedisplay: [1, 34, 9],
      }

      const { status, data } = await this.Search('User', criteria)
      if (status !== HttpStatus.OK || !data['data']) return ''

      const user = data['data'][0]
      return `${user[34] || ''} ${user[9] || ''}`.trim()
   }

   async GetUserProfile(asUser: string = this._username, sessionInfo: IGlpiSession = this.sessionInfo) {
      if (asUser !== this._username) {
         const token = await this._GetUserToken(asUser)
         if (token) {
            const { status, data } = await this._Login(token)
            if (status === HttpStatus.OK) {
               sessionInfo = data
            } else {
               return null
            }
         } else {
            return null
         }
      }
      const helper = new Helper(sessionInfo)
      return { glpiId: this.userId, profile: { ...await helper.getProfile() } }
   }

   private async _AddCriteria(criteria: ICriteriaType[], parent: string = ''): Promise<Record<string, any>> {
      const _criteria = {}
      const prefix = parent ? `${parent}[criteria]` : 'criteria'

      for (const [index, criterion] of criteria.entries()) {
         if (criterion.criteria) {
            _criteria[`${prefix}[${index}][link]`] = criterion.link || 'AND'
            Object.assign(_criteria, await this._AddCriteria(criterion.criteria, `criteria[${index}]`))
         } else {
            if (criterion.link) _criteria[`${prefix}[${index}][link]`] = criterion.link
            if (criterion.meta) _criteria[`${prefix}[${index}][meta]`] = criterion.meta
            if (criterion.itemType) _criteria[`${prefix}[${index}][itemtype]`] = criterion.itemType
            _criteria[`${prefix}[${index}][field]`] = criterion.field
            _criteria[`${prefix}[${index}][searchtype]`] = criterion.searchtype
            _criteria[`${prefix}[${index}][value]`] = criterion.value
         }
      }

      return _criteria
   }

   async _ParseContentRange(header: string): Promise<ContentRange> {
      const match = header.match(/^(\d+)-(\d+)\/(\d+)$/)
      if (!match) throw new RangeError(`Unsupported range: ${match}`)

      const start = parseInt(match[1], 10)
      const end = parseInt(match[2], 10)
      const total = parseInt(match[3], 10)

      return { start, end, total }
   }

   async _PartialReader(itemType: string, params: PayloadType, data: any, contentRangeHeader: string) {
      const { end: initEndRange, total } = await this._ParseContentRange(contentRangeHeader)

      let allData: any[] = []
      let allRawData: any[] = []
      if (Array.isArray(data)) allData = [...data]
      else if (data && Array.isArray(data['data'])) allData = [...data['data']]
      else throw new Error('Invalid format of initial response data')

      allRawData = data.rawdata?.data?.rows ?? []

      let offset = initEndRange + 1
      const step = 200
      const upperBound = () => (offset + step - 1) >= total - 1 ? total - 1 : offset + step - 1

      while (offset < total) {
         const range = `${offset}-${upperBound()}`
         const {
            status: _status,
            data: _data,
            headers: _headers,
         } = await this._HandleRequest(this.session.get(itemType, {
            params: { ...params, range: range },
         }))

         if(![HttpStatus.OK, HttpStatus.PARTIAL_CONTENT].includes(_status)) {
         }

         if (![HttpStatus.OK, HttpStatus.PARTIAL_CONTENT].includes(_status)) throw new Error(`Fetching partial content failed`)
         let chunk = []

         if (Array.isArray(_data)) chunk = _data
         else if (_data && _data['data']) chunk = _data['data']
         else {
            throw new Error('Invalid format of response during pagination')
         }

         allData.push(...chunk)
         allRawData.push(...data.rawdata?.data?.rows ?? [])

         const _contentRangeHeader = _headers['content-range'] || _headers['Content-Range']
         if (!_contentRangeHeader) break

         const { end } = await this._ParseContentRange(_contentRangeHeader)
         offset = end + 1
      }
      return { data: allData, rawData: allRawData }
   }

   async ListSearchOptions(itemType: string) {
      return this._HandleRequest(this.session.get('listSearchOptions/' + itemType))
   }

   async Search(itemType: string, searchData: ISearch): Promise<GlpiApiResponse> {
      const params: PayloadType = {}

      if (searchData.sort) {
         const { status, data } = await this.ListSearchOptions(itemType)
         if (status === HttpStatus.OK) {
            let found = false
            for (const [key, value] of Object.entries(data)) {
               if (value['uid'] === `${itemType}.${searchData.sort}`) {
                  params['sort'] = key
                  found = true
                  break
               }
            }
            if (!found) {
               params['sort'] = 2  // ID-field number
            }
         } else params['sort'] = 2  // ID-field number
      }
      if (searchData.order) params['order'] = searchData.order
      if (searchData.range) params['range'] = searchData.range
      if (searchData.rawdata) params['rawdata'] = searchData.rawdata
      if (searchData.filters) Object.assign(params, await this._AddCriteria(searchData.filters))
      if (Object.prototype.hasOwnProperty.call(searchData, 'uid_cols')) params['uid_cols'] = searchData.uid_cols
      if (Object.prototype.hasOwnProperty.call(searchData, 'get_hateoas')) params['get_hateoas'] = searchData.get_hateoas
      if (searchData.forcedisplay) {
         searchData.forcedisplay.forEach((field, index) => {
            params[`forcedisplay[${index}]`] = field
         })
      }

      const {
         status,
         data,
         headers,
      } = await this._HandleRequest(this.session.get(`search/${itemType}`, { params: params }))


      if (status === HttpStatus.PARTIAL_CONTENT) {
         const contentRangeHeader = headers['content-range'] || headers['Content-Range']
         const {
            data: _data,
            rawData,
         } = await this._PartialReader(`search/${itemType}`, params, data, contentRangeHeader)
         return { status: HttpStatus.OK, data: _data, rawData: rawData }
      } else {
         const rawData = searchData.rawdata ? data.rawdata?.data?.rows ?? [] : []
         const formatedData = Array.isArray(data) ? data : data.data && Array.isArray(data.data) ? data.data : [data.data]
         return { status, data: formatedData, rawData }
      }
   }

   async AddItems(itemType: string, payload: PayloadType | PayloadType[], retries: number = 3): Promise<GlpiApiResponse> {
      return this._HandleRequest(this.session.post(itemType, { input: payload }), retries)
   }

   async UpdateItem(itemType: string, payload: PayloadType | PayloadType[]): Promise<GlpiApiResponse> {
      return this._HandleRequest(this.session.put(itemType, { input: payload }))
   }

   async DeleteItems(itemType: string, payload: PayloadType | PayloadType[]): Promise<GlpiApiResponse> {
      return this._HandleRequest(this.session.delete(itemType, { data: { input: payload } }))
   }

   async CreateFollowup(ticketId: number, text: string): Promise<GlpiApiResponse> {
      const payload: PayloadType = {
         itemtype: 'Ticket',
         items_id: ticketId,
         users_id: this.userId,
         content: text,
      }
      return this.AddItems('ITILFollowup', payload)
   }

   async SwitchTicketNotification(ticketId: number, state: 0 | 1): Promise<GlpiApiResponse> {
      const criteria: ISearch = {
         filters: [
            { field: 3, searchtype: 'equals', value: ticketId },
            { link: 'AND', field: 4, searchtype: 'equals', value: this.userId },
         ],
         forcedisplay: [2],
      }

      const { status, data } = await this.Search('Ticket_User', criteria)

      if (status === HttpStatus.OK || status === HttpStatus.PARTIAL_CONTENT) {
         const payload: PayloadType[] = data.data.map((record: any) => ({
            id: record['2'],
            use_notification: state,
         }))

         return this.UpdateItem('Ticket_User', payload)
      }

      return { status, data }
   }

   async UploadDocument(files: Express.Multer.File[]): Promise<GlpiApiResponse> {
      const FormData = require('form-data')
      const form = new FormData()

      form.append('uploadManifest', JSON.stringify({
         input: files.map(file => ({
            name: decodeURIComponent(file.originalname),
            _filename: [decodeURIComponent(file.originalname)],
         })),
      }))

      files.forEach((file) => {
         form.append(decodeURIComponent(file.originalname), file.buffer, decodeURIComponent(file.originalname))
      })

      const headers = {
         'Content-Type': 'multipart/forms-data',
         ...form.getHeaders(),
      }

      return this._HandleRequest(this.session.post('Document', form, { headers }))
   }

   async UploadTicketDocument(files: Express.Multer.File[], ticketId: number, asUser: string | null = null) {
      const userId = asUser ? await this.GetUserId(asUser) : this.userId

      const { status, data } = await this.UploadDocument(files)

      if ([HttpStatus.CREATED, HttpStatus.MULTI_STATUS].includes(status)) {
         if (typeof data === 'string') return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            ticketId,
            data: 'Ошибка создания файла',
         }
         else {
            const payload: PayloadType[] = data.map((file: any) => ({
               documents_id: file.id,
               itemtype: 'Ticket',
               items_id: ticketId,
               users_id: userId,
            }))

            const { status: _status, data: _data } = await this.AddItems('Document_Item', payload)
            return { status: _status, ticketId: ticketId, data: _data }
         }


      } else return { status, ticketId, data }
   }

   async DownloadDocument(docId: number) {
      const headers = { 'Accept': 'application/octet-stream' }

      const response = await this.session.get(`Document/${docId}`, {
         headers,
         responseType: 'arraybuffer',
      })

      const mime = response.headers['content-type']
      const { data, status } = response

      return {
         status: status === HttpStatus.UNAUTHORIZED ? HttpStatus.BAD_REQUEST : status,
         data,
         mime,
      }
   }

   async GetUserPicture(userId: number): Promise<GlpiApiResponse> {
      return this._HandleRequest(this.session.get(`User/${userId}/Picture`))
   }
}

