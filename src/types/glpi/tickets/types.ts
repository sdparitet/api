import { InterfaceType, ItemType } from '~t_c_glpi/types'
import { ApiProperty } from '@nestjs/swagger'


export type RequestTypeEnum = 1 | 2  // 1 - инцидент, 2 - запрос
export type StatusEnum = 1 | 2 | 3 | 4 | 5 | 6  // 1 - новая, 2 - в работе, 3 - запланирована, 4 - в ожидании, 5 - решена, 6 - закрыта
export type MemberTypeEnum = 1 | 2  // 1 - пользователь, 2 - группа
export type AccessoryTypeEnum = 1 | 2 | 3  // 1 - инициатор, 2 - исполнитель, 3 - наблюдатель
export type ChatItemTypeEnum = 'Service' | 'Blank' | 'Message' | 'File' | 'Image' | 'Solution' | 'Task' | 'Agreement'


class ActiveProfile {
   @ApiProperty()
   id: number
   @ApiProperty()
   name: string
   @ApiProperty()
   interface: InterfaceType
   @ApiProperty()
   helpdesk_item_type: ItemType[]
   @ApiProperty()
   ticket_status: null | [] | Partial<Record<'1' | '2' | '3' | '4' | '5' | '6',
      Record<'1' | '2' | '3' | '4' | '5' | '6', 0 | 1>>>
   @ApiProperty()
   ticketvalidation: number
   @ApiProperty()
   ticket: number
   @ApiProperty()
   followup: number
   @ApiProperty()
   task: number

}


class Entity {
   @ApiProperty()
   id: number
   @ApiProperty()
   name: string
   @ApiProperty()
   is_recursive: 0 | 1
}


class Profile {
   @ApiProperty()
   name: string
   @ApiProperty()
   entities: Entity[]
}


class Session {
   @ApiProperty()
   glpiID: number
   @ApiProperty()
   glpifriendlyname: string
   @ApiProperty()
   glpiname: string
   @ApiProperty()
   glpirealname: string
   @ApiProperty()
   glpifirstname: string
   @ApiProperty()
   glpidefault_entity: number
   @ApiProperty()
   glpiextauth: 0 | 1
   @ApiProperty()
   glpiauthtype: number
   @ApiProperty()
   glpiprofiles: Record<string, Profile>

   @ApiProperty()
   glpiactiveprofile: ActiveProfile

   @ApiProperty()
   glpigroups: Array<number>
}


export class IGlpiSession {
   @ApiProperty()
   session_token: string
   @ApiProperty()
   session: Session
}
