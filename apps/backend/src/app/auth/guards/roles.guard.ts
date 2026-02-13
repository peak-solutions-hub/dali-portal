import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ORPCError } from "@orpc/nest";
import { AppError, type RoleType } from "@repo/shared";
import type {
	SupabaseClient,
	User as SupabaseUser,
} from "@supabase/supabase-js";
import { DbService } from "@/app/db/db.service";
import { SupabaseAdminService } from "@/app/util/supabase/supabase-admin.service";
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
	private readonly logger = new Logger(RolesGuard.name);
	private readonly supabase: SupabaseClient;

	constructor(
		private readonly reflector: Reflector,
		private readonly supabaseAdmin: SupabaseAdminService,
		private readonly db: DbService,
	) {
		this.supabase = this.supabaseAdmin.getClient();
	}

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
		// Get required roles from decorator
		const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()],
		);

		// If no roles are required, allow access (public route)
		if (!requiredRoles || requiredRoles.length === 0) {
			return true;
		}

		// Roles are required - authenticate the user
		const request = context.switchToHttp().getRequest();

		// Extract Bearer token from Authorization header
		const authHeader = request.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			this.logger.warn("Auth failed: missing Bearer token");
			throw new AppError("AUTH.MISSING_TOKEN");
		}

		const token = authHeader.substring(7);

		// Verify the token using Supabase's getUser() API
		const {
			data: { user: supabaseUser },
			error: authError,
		} = await this.supabase.auth.getUser(token);

		if (authError || !supabaseUser) {
			this.logger.warn("Auth failed: invalid or expired Supabase token");
			throw new AppError("AUTH.INVALID_TOKEN");
		}

		// Get user data from cache or database
		const userData = await this.getUserData(supabaseUser.id);

		if (!userData) {
			this.logger.warn(
				`Auth failed: user not found for supabaseId=${supabaseUser.id}`,
			);
			throw new AppError("USER.NOT_FOUND");
		}

		// Check if user is deactivated
		if (userData.status === "deactivated") {
			// Invalidate cache for deactivated user
			userCache.delete(supabaseUser.id);
			this.logger.warn(
				`Auth blocked: deactivated account userId=${userData.id} email=${userData.email}`,
			);
			throw new ORPCError("DEACTIVATED_ACCOUNT", {
				status: 401,
				message: "User account is deactivated.",
			});
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

		// Check if user has one of the required roles
		const hasRequiredRole = requiredRoles.some(
			(role) => role === userData.roleName,
		);

		if (!hasRequiredRole) {
			this.logger.warn(
				`Auth blocked: insufficient permissions userId=${userData.id} role=${userData.roleName}`,
			);
			throw new AppError("AUTH.INSUFFICIENT_PERMISSIONS");
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
