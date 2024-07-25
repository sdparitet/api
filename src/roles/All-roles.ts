import {Kpi_Roles} from './kpi.roles';
import {Staff_Roles} from '~roles/staff.roles';
import {Stat_Roles} from '~roles/stat.roles';
import {GLPI_Roles} from '~roles/glpi.roles';
import {Form_Roles} from "~roles/form.roles";

export const GlobalRoles = {
    ADMIN: 'Auth_Admin',
    MANAGER: 'Auth_Manager',
} as const

export const AllRoles = {
    ...GlobalRoles,
    ...Kpi_Roles,
    ...Staff_Roles,
    ...Stat_Roles,
    ...GLPI_Roles,
    ...Form_Roles,
} as const
