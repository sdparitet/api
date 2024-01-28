import { SetMetadata } from "@nestjs/common";

export const HAS_ROLES = "has_roles";
export const NOT_ROLES = "not_roles";
export const USER_DATA = "not_roles";

export const Public = () => SetMetadata("isPublic", true);

export const Roles = (...roles: string[]) => SetMetadata(HAS_ROLES, roles);
export const NotRoles = (...roles: string[]) => SetMetadata(NOT_ROLES, roles);
