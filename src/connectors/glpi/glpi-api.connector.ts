import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { DataSource } from 'typeorm'
import {
   CriteriaType,
   GlpiApiInitResponse,
   GlpiApiResponse,
   IGlpiSession,
   ISearch,
   PayloadType,
} from '~connectors/glpi/types'
import { HttpStatus } from '@nestjs/common'
import * as http from 'node:http'
import * as https from 'node:https'
import { Helper } from '~connectors/glpi/helper'
import { Cache } from 'cache-manager'


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

   constructor(username: string, private readonly redis: Cache, private readonly glpi: DataSource) {
      this._username = username
      this.session = this._InitAxios()
   }

   private _InitAxios(): AxiosInstance {
      return axios.create({
         baseURL: this._baseUrl,
         timeout: 10000,
         httpAgent: new http.Agent({ keepAlive: true }),
         httpsAgent: new https.Agent({ keepAlive: true }),
         headers: {
            'User-Agent': 'Mozilla/5.0',
            'Content-Type': 'application/json',
            'App-Token': this._appToken,
         },
         validateStatus: (status: number) => status >= 200 && status < 500,
      })
   }

   private async _GetStoredSession(): Promise<boolean> {
      const storedSession: IGlpiSession = await this.redis.get(`session_${this._username}`)
      if (storedSession) {
         const { status } = await this._HandleRequest(this.session.get(`getActiveEntities`))
         if (status === HttpStatus.OK) {
            this.sessionInfo = storedSession
            this.authorized = true
            this.userId = storedSession.session.glpiID
            this.userFio = storedSession.session.glpifriendlyname
            this.sessionToken = storedSession.session_token
            this.session.defaults.headers.common['Session-Token'] = this.sessionToken

            return true
         } else {
            return false
         }
      } else {
         return false
      }
   }

   async InitSession(): Promise<void> {
      const isSessionExists = await this._GetStoredSession()

      if (!isSessionExists) {
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

               await this.redis.set(`session_${this._username}`, this.sessionInfo, 86400)
            }
         }
      }
   }

   private async _Login(token: string): Promise<GlpiApiInitResponse> {
      try {
         const { status, data } = await this.session.get('initSession', {
            headers: { 'Authorization': `user_token ${token}` },
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
         const { status, data } = await request
         return { status, data }
      } catch (err) {
         if (retries > 0) {
            console.log(err)
            return this._HandleRequest(request, retries - 1)
         } else {
            return { status: HttpStatus.INTERNAL_SERVER_ERROR, data: err }
         }
      }
   }

   async GetItem(itemType: string, itemId: number, params: PayloadType = {}): Promise<GlpiApiResponse> {
      return this._HandleRequest(this.session.get(`${itemType}/${itemId}`, { params: params }))
   }

   async GetAllItems(itemType: string, params: PayloadType = {}): Promise<GlpiApiResponse> {
      const allData = []
      let left = 0
      const step = 200

      while (true) {
         const right = left + step - 1
         const { status, data, headers } = await this.session.get(itemType, {
            params: { ...params, 'range': `${left}-${right}` },
         })

         if (status === HttpStatus.UNAUTHORIZED) {
            return { status, data }
         }

         allData.push(...data)

         if (status === 206) {
            const [range, total] = headers['content-range'].split('/')
            const [, end] = range.split('-')
            left = parseInt(end) + 1
            if (left >= total) break
         } else break
      }

      return { status: HttpStatus.OK, data: allData }
   }

   async GetUserId(username: string): Promise<number> {
      const criteria: ISearch = {
         criteria: [{ field: 1, searchtype: 'contains', value: `^${username}$` }],
         forcedisplay: [2],
      }

      const { status, data } = await this.Search('User', criteria)
      return status === HttpStatus.OK ? data['data'] ? data['data'][0]['2'] : 0 : 0
   }

   async GetUserFio(username: string): Promise<string> {
      const criteria: ISearch = {
         criteria: [{ field: 1, searchtype: 'contains', value: `^${username}$` }],
         forcedisplay: [1, 34, 9],
      }

      const { status, data } = await this.Search('User', criteria)
      if (status !== HttpStatus.OK || !data['data']) return ''

      const user = data['data'][0]
      return `${user[34] || ''} ${user[9] || ''}`.trim()
   }

   private async _AddCriteria(criteria: CriteriaType[], parent: string = ''): Promise<object[]> {
      const _criteria = []
      const prefix = parent ? `${parent}[criteria]` : 'criteria'

      for (const [index, criterion] of criteria.entries()) {
         if (criterion.criteria) {
            _criteria.push({ [`${prefix}[${index}][link]`]: criterion.link || 'AND' })
            _criteria.push(...await this._AddCriteria(criterion.criteria, `criteria[${index}]`))
         } else {
            if (criterion.link) _criteria.push({ [`${prefix}[${index}][link]`]: criterion.link })
            _criteria.push({ [`${prefix}[${index}][field]`]: criterion.field })
            _criteria.push({ [`${prefix}[${index}][searchtype]`]: criterion.searchtype })
            _criteria.push({ [`${prefix}[${index}][value]`]: criterion.value })
         }
      }

      return _criteria
   }

   async Search(itemType: string, searchData: ISearch): Promise<GlpiApiResponse> {
      const rawParams = []

      if (searchData.sort) rawParams.push({ sort: searchData.sort })
      if (searchData.order) rawParams.push({ order: searchData.order })
      if (searchData.criteria) rawParams.push(...await this._AddCriteria(searchData.criteria))
      if (searchData.forcedisplay) rawParams.push(...searchData.forcedisplay.map((fieldId, index) => ({ [`forcedisplay[${index}]`]: fieldId })))

      const params = new URLSearchParams(Object.assign({}, ...rawParams)).toString()
      return this._HandleRequest(this.session.get(`search/${itemType}?${params}`))
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
         criteria: [
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
         'Content-Type': 'multipart/form-data',
         ...form.getHeaders(),
      }

      return this._HandleRequest(this.session.post('Document', form, { headers }))
   }

   async UploadTicketDocument(files: Express.Multer.File[], ticketId: number, asUser: string | null = null) {
      const { status, data } = await this.UploadDocument(files)
      const userId = asUser ? await this.GetUserId(asUser) : this.userId

      try {
         const payload: PayloadType[] = data.map((file: any) => ({
            documents_id: file.id,
            itemtype: 'Ticket',
            items_id: ticketId,
            users_id: userId,
         }))

         await this.AddItems('Document_Item', payload)

         return { status, ticket_id: ticketId, data }
      }
      catch (e) {
         console.log('[ERROR] Data is not defined', data, '\n',e)
         return { status: HttpStatus.INTERNAL_SERVER_ERROR, ticket_id: ticketId, data: data }
      }
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
