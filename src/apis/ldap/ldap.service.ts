import { Injectable } from "@nestjs/common";
import * as process from 'node:process'
import LdapClient from 'ldapjs-client'
import { ILDAPUserDto, LDAP_User } from "./dto/get-request-dto";
// import * as SimpleLDAP from 'simple-ldap-search'
// import { ILDAPUserDto, LDAP_User } from '~ldap/dto/get-request-dto'

@Injectable()
export class LDAP_Service {
   constructor( ) { }


   async GetLDAPUsers() {

      // const config = {
      //    url: process.env.LDAP_URL,
      //    dn: process.env.LDAP_BIND_USER,
      //    password: process.env.LDAP_BIND_PASS,
      //    base: process.env.LDAP_SEARCH_BASE,
      // };
      // const ldap = new SimpleLDAP(config);
      // const filter = process.env.LDAP_SEARCH_FILTER
      // const attributes = ['cn', 'sn', 'givenName', 'telephoneNumber', 'distinguishedName', 'displayName', 'department', 'company', 'name', 'sAMAccountName', 'userPrincipalName', 'mail', 'description']
      //
      // const _users: Partial<ILDAPUserDto>[] | Error = await ldap.search(filter, attributes);
      // if ('message' in _users ) {
      //    console.log(_users.message)
      //    return []
      // }
      // return _users.map(u => new LDAP_User(u))

      const client = new LdapClient({ url: process.env.LDAP_URL });

      try {
         await client.bind(process.env.LDAP_BIND_USER, process.env.LDAP_BIND_PASS);
         const options = {
            filter: process.env.LDAP_SEARCH_FILTER,
            scope: 'sub',
            attributes: ['cn', 'sn', 'givenName', 'telephoneNumber', 'distinguishedName', 'displayName', 'department', 'company', 'name', 'sAMAccountName', 'userPrincipalName', 'mail', 'description']
         };

         const _users: Partial<ILDAPUserDto>[] | Error = await client.search(process.env.LDAP_SEARCH_BASE, options);
         if ('message' in _users ) {
            console.log(_users.message)
            return []
         }
         return _users.map(u => new LDAP_User(u)).filter(u => u.dn.length > 0)

      } catch (e) {
         console.log('LDAP failed', e.message || '');
         return []
      }

   }

}
