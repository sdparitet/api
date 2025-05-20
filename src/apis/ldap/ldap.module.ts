import { Module } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';

import { LDAP_Service } from "~ldap/ldap.service";
import { LDAP_Controller } from '~ldap/ldap.controller';

@Module({
   providers: [LDAP_Service, JwtService],
   controllers: [LDAP_Controller],
   exports: [LDAP_Service],
})
export class LDAP_Module {}
