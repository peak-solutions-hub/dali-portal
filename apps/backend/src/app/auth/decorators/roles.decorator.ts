import { SetMetadata } from "@nestjs/common";
import type { RoleType } from "@repo/shared";

export const ROLES_KEY = "roles";

/**
 * Decorator to specify which roles are allowed to access a route.
 * Use with RolesGuard to enforce role-based access control.
 *
 * @example
 * ```typescript
 * @Roles(RoleType.IT_ADMIN, RoleType.HEAD_ADMIN)
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Get('admin/users')
 * getUsers() { ... }
 * ```
 *
 * @param roles - Array of allowed role types
 */
export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);
