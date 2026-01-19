import {
	type CanActivate,
	type ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { RoleType } from "@repo/shared";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthenticatedUser } from "../strategies/supabase-jwt.strategy";

/**
 * Guard that enforces role-based access control (RBAC).
 * Must be used AFTER JwtAuthGuard to ensure the user is authenticated.
 *
 * This guard:
 * 1. Extracts required roles from the @Roles() decorator
 * 2. Gets the authenticated user from the request (set by JwtAuthGuard)
 * 3. Verifies the user's role matches one of the required roles
 * 4. Throws ForbiddenException if the user's role is not allowed
 * 5. Throws ForbiddenException if the user is suspended/deactivated
 *
 * @example
 * ```typescript
 * @Roles(RoleType.IT_ADMIN, RoleType.HEAD_ADMIN)
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Get('admin/sensitive-data')
 * getSensitiveData() { ... }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		// Check if route is marked as public
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (isPublic) {
			return true;
		}

		// Get required roles from decorator
		const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()],
		);

		// If no roles are required, allow access (authentication is still required via JwtAuthGuard)
		if (!requiredRoles || requiredRoles.length === 0) {
			return true;
		}

		// Get the authenticated user from the request
		const request = context.switchToHttp().getRequest();
		const user = request.user as AuthenticatedUser | undefined;

		if (!user) {
			throw new UnauthorizedException("Authentication required");
		}

		// Check if user is deactivated (double-check in case status changed after JWT was issued)
		if (user.status === "deactivated") {
			throw new ForbiddenException("User account is deactivated");
		}

		// Check if user has one of the required roles
		const hasRequiredRole = requiredRoles.some((role) => role === user.role);

		if (!hasRequiredRole) {
			throw new ForbiddenException(
				`Access denied. Required roles: ${requiredRoles.join(", ")}`,
			);
		}

		return true;
	}
}
