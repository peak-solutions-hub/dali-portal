import {
	type CanActivate,
	type ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { RoleType } from "@repo/shared";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { DbService } from "@/app/db/db.service";
import type { User as PrismaUser } from "@/generated/prisma/client";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { ROLES_KEY } from "../decorators/roles.decorator";

/**
 * Guard that enforces role-based access control (RBAC).
 * Must be used AFTER AuthGuard to ensure the user is authenticated.
 *
 * This guard:
 * 1. Checks if the route is marked with @Public() (skips if so)
 * 2. Extracts required roles from the @Roles() decorator
 * 3. Gets the authenticated Supabase user from request.user (set by AuthGuard)
 * 4. Queries the public.users table via Prisma to get the user's role and status
 * 5. Enriches request.user with DB data (role, fullName, status)
 * 6. Verifies the user's role matches one of the required roles
 * 7. Throws ForbiddenException if the user's role is not allowed or account is deactivated
 *
 * @example
 * ```typescript
 * @Roles(RoleType.IT_ADMIN, RoleType.HEAD_ADMIN)
 * @Get('admin/sensitive-data')
 * getSensitiveData(@CurrentUser() user: EnrichedUser) { ... }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly db: DbService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Check if route is marked as public
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (isPublic) {
			return true;
		}

		// Get the authenticated Supabase user from the request (set by AuthGuard)
		const request = context.switchToHttp().getRequest();
		const supabaseUser = request.user as SupabaseUser | undefined;

		if (!supabaseUser?.id) {
			throw new UnauthorizedException("Authentication required");
		}

		// Query the database to get the user's role and status
		const dbUser = await this.db.user.findUnique({
			where: { id: supabaseUser.id },
			select: {
				id: true,
				email: true,
				fullName: true,
				role: {
					select: {
						name: true,
					},
				},
				status: true,
			},
		});

		if (!dbUser) {
			throw new UnauthorizedException("User not found in database");
		}

		// Check if user is deactivated
		if (dbUser.status === "deactivated") {
			throw new ForbiddenException("User account is deactivated");
		}

		// Enrich the request.user with DB data for use in controllers
		request.user = {
			...supabaseUser,
			id: dbUser.id,
			email: dbUser.email,
			fullName: dbUser.fullName,
			role: dbUser.role.name as RoleType,
			status: dbUser.status,
		};

		// Get required roles from decorator
		const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()],
		);

		// If no roles are required, allow access (authentication is still required via AuthGuard)
		if (!requiredRoles || requiredRoles.length === 0) {
			return true;
		}

		// Check if user has one of the required roles
		const hasRequiredRole = requiredRoles.some(
			(role) => role === dbUser.role.name,
		);

		if (!hasRequiredRole) {
			throw new ForbiddenException(
				`Access denied. Required roles: ${requiredRoles.join(", ")}`,
			);
		}

		return true;
	}
}

/**
 * Type for the enriched user object attached to request.user after RolesGuard.
 * Combines Supabase Auth user + DB user data (role, fullName, status).
 */
export type EnrichedUser = SupabaseUser & {
	id: string;
	email: string;
	fullName: string;
	role: RoleType;
	status: string;
};
