import { LDAP_Roles } from '~roles/ldap.roles'
import {Kpi_Roles} from './kpi.roles';
import {Oup_Roles} from '~roles/oup.roles';
import {Stat_Roles} from '~roles/stat.roles';
import {GLPI_Roles} from '~roles/glpi.roles';
import {Form_Roles} from "~roles/form.roles";
import {Portal_Roles} from "~roles/portal.roles";
import {Oit_Roles} from '~roles/oit.roles'

export const GlobalRoles = {
    ADMIN: 'Auth_Admin',
    MANAGER: 'Auth_Manager',
} as const

export const AllRoles = {
    ...GlobalRoles,
    ...Kpi_Roles,
    ...LDAP_Roles,
    ...Oup_Roles,
    ...Oit_Roles,
    ...Stat_Roles,
    ...GLPI_Roles,
    ...Form_Roles,
    ...Portal_Roles,
} as const
