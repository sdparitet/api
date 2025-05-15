
export interface ILDAPUser {
   dn: string
   name: string
   sonameName: string
   fullName: string
   login: string
   account: string
   email: string
   telephone: string
   company: string
   department: string
}

export interface ILDAPUserDto {
   dn: string
   cn: string
   sn: string
   telephoneNumber: string
   givenName: string
   distinguishedName: string
   displayName: string
   department: string
   company: string
   name: string
   sAMAccountName: string
   userPrincipalName: string
   mail: string
}

export class LDAP_User implements ILDAPUser {
   constructor(user: Partial<ILDAPUserDto>) {
      this.dn = user.distinguishedName || ''
      this.name = user.givenName || (user.name || '').split(' ')[1] || ''
      this.sonameName = user.sn || (user.name || '').split(' ')[0] || ''
      this.fullName = user.cn || user.displayName || user.name || ''
      this.login = user.sAMAccountName || ''
      this.account = user.userPrincipalName || ''
      this.email = user.mail || ''
      this.telephone = String(user.telephoneNumber || '')
      this.company = user.company || ''
      this.department = user.department || ''
   }

   readonly dn: string
   readonly name: string
   readonly sonameName: string
   readonly fullName: string
   readonly login: string
   readonly account: string
   readonly email: string
   readonly telephone: string
   readonly company: string
   readonly department: string
}
