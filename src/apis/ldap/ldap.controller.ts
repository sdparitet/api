import { Controller, Get, Header } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { LDAP_Roles } from '~roles/ldap.roles'
import { LDAP_Service } from '~ldap/ldap.service'
import { Roles } from '~guards/roles-auth.decorator'


@ApiTags('ldap')
@Controller('ldap')
export class LDAP_Controller {
   constructor(private ldapService: LDAP_Service) {
   }

   @Roles(LDAP_Roles.LDAP_USER)
   @Get('/GetLDAPUsers')
   @Header('content-type', 'application/json')
   gcs() {
      return this.ldapService.GetLDAPUsers()
   }
}

