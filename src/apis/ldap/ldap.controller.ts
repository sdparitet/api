import { Controller, Get, Header } from "@nestjs/common";
import { LDAP_Service } from "~ldap/ldap.service";
import { Roles } from '~guards/roles-auth.decorator';
import { GlobalRoles } from '~roles/All-roles';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('ldap')
@Controller("ldap")
export class LDAP_Controller {
   constructor(private ldapService: LDAP_Service) { }

   @Roles(...Object.values(GlobalRoles))
   @Get("/GetLDAPUsers")
   @Header("content-type", "application/json")
   gcs() {
      return this.ldapService.GetLDAPUsers();
   }
}

