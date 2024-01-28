import { Kpi_Roles } from './kpi.roles';

export const GlobalRoles = {
   ADMIN: 'Auth_Admin',
   MANAGER: 'Auth_Manager',
} as const

export const AllRoles = {
   ...GlobalRoles,
   ...Kpi_Roles,
} as const
