import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { DbService } from "@/app/db/db.service";
import { ConfigService } from "@/lib/config.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * Simple authentication guard that verifies JWT tokens using Supabase.
 * No Passport.js, no strategies - just direct Supabase client usage.
 *
 * This guard:
 * 1. Checks if the route is marked with @Public() (skips auth if so)
 * 2. Extracts the Bearer token from the Authorization header
 * 3. Validates the token using Supabase's auth.getUser() API
 * 4. Attaches the authenticated user to request.user
 *
 * @example
 * ```typescript
 * // Apply to a single route
 * @UseGuards(AuthGuard)
 * @Get('protected')
 * protectedRoute() { ... }
 *
 * // Applied globally in app.module.ts
 * providers: [{ provide: APP_GUARD, useClass: AuthGuard }]
 * ```
 */
@Injectable()
export class AuthGuard implements CanActivate {
	private readonly supabase;

	constructor(
		private readonly reflector: Reflector,
		private readonly configService: ConfigService,
		private readonly db: DbService,
	) {
		// Create Supabase client for token verification
		const supabaseUrl = this.configService.getOrThrow("supabase.url") as string;
		const serviceRoleKey = this.configService.getOrThrow(
			"supabase.serviceRoleKey",
		) as string;

		this.supabase = createClient(supabaseUrl, serviceRoleKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		});
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

		const request = context.switchToHttp().getRequest();

		// Extract Bearer token from Authorization header
		const authHeader = request.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			throw new UnauthorizedException(
				"Missing or invalid Authorization header",
			);
		}

		const token = authHeader.substring(7);

		try {
			// Verify the token using Supabase's getUser() API
			const {
				data: { user },
				error,
			} = await this.supabase.auth.getUser(token);

			if (error || !user) {
				throw new UnauthorizedException("Invalid or expired token");
			}

			// Check DB status to prevent deactivated users from authenticating
			try {
				const dbUser = await this.db.user.findUnique({
					where: { id: user.id },
					select: { status: true },
				});

				if (dbUser?.status === "deactivated") {
					throw new UnauthorizedException("User account is deactivated");
				}
			} catch (err) {
				if (err instanceof UnauthorizedException) throw err;
				console.error("AuthGuard DB check error:", err);
				throw new UnauthorizedException("Token verification failed");
			}

			// Attach the Supabase user to the request
			// RolesGuard will enrich this with DB user data (role, status, etc.)
			(request as RequestWithUser).user = user;

			return true;
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			throw new UnauthorizedException("Token verification failed");
		}
	}
}

/**
 * Type for the authenticated user object attached to the request.
 * This is the Supabase Auth user (minimal) - RolesGuard will enrich it with DB data.
 */
export type AuthenticatedUser = SupabaseUser;

/**
 * Extended request type with user property
 */
interface RequestWithUser {
	user?: SupabaseUser;
}
