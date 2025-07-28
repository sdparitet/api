import { SetMetadata } from '@nestjs/common'
import { GlobalRoles } from '~roles/global-roles'


export const HAS_ROLES = 'has_roles'
export const NOT_ROLES = 'not_roles'
export const PUBLIC = 'public'


export const Public = () => SetMetadata(PUBLIC, true)
export const Roles = (...roles: (string | string[])[]) => SetMetadata(HAS_ROLES, [...roles, ...Object.values(GlobalRoles)])
export const NotRoles = (...roles: (string | string[])[]) => SetMetadata(NOT_ROLES, roles)
