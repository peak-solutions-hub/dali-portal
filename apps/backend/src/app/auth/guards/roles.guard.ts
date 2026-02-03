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
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { ROLES_KEY } from "../decorators/roles.decorator";

/**
 * In-memory cache for user data to avoid database queries on every request.
 * Uses a simple TTL-based cache with 60 second expiry.
 */
interface CachedUserData {
	id: string;
	email: string;
	fullName: string;
	roleName: RoleType;
	status: string;
	cachedAt: number;
}

const userCache = new Map<string, CachedUserData>();
const CACHE_TTL_MS = 60_000; // 1 minute

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly db: DbService,
	) {}

	/**
	 * Get user data from cache or database.
	 * Implements a simple TTL-based caching strategy.
	 */
	private async getUserData(userId: string): Promise<CachedUserData | null> {
		const cached = userCache.get(userId);
		if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
			return cached;
		}

		// Cache miss or expired - fetch from database
		const dbUser = await this.db.user.findUnique({
			where: { id: userId },
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
			userCache.delete(userId);
			return null;
		}

		const userData: CachedUserData = {
			id: dbUser.id,
			email: dbUser.email,
			fullName: dbUser.fullName,
			roleName: dbUser.role.name as RoleType,
			status: dbUser.status,
			cachedAt: Date.now(),
		};

		userCache.set(userId, userData);
		return userData;
	}

	/**
	 * Invalidate cache for a specific user.
	 * Call this when user data changes (role update, status change, etc.)
	 */
	static invalidateUserCache(userId: string): void {
		userCache.delete(userId);
	}

	/**
	 * Clear entire user cache.
	 * Useful for testing or when bulk changes occur.
	 */
	static clearCache(): void {
		userCache.clear();
	}

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

		// Get user data from cache or database
		const userData = await this.getUserData(supabaseUser.id);

		if (!userData) {
			throw new UnauthorizedException("User not found in database");
		}

		// Check if user is deactivated
		if (userData.status === "deactivated") {
			// Invalidate cache for deactivated user
			userCache.delete(supabaseUser.id);
			throw new ForbiddenException("User account is deactivated");
		}

		// Enrich the request.user with cached data for use in controllers
		request.user = {
			...supabaseUser,
			id: userData.id,
			email: userData.email,
			fullName: userData.fullName,
			role: userData.roleName,
			status: userData.status,
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
			(role) => role === userData.roleName,
		);

		if (!hasRequiredRole) {
			throw new ForbiddenException("Access denied. Insufficient permissions.");
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
