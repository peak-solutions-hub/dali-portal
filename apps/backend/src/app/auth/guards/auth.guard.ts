import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AppError } from "@repo/shared";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DbService } from "@/app/db/db.service";
import { ConfigService } from "@/lib/config.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

let supabaseClient: SupabaseClient | null = null;

@Injectable()
export class AuthGuard implements CanActivate {
	private readonly supabase: SupabaseClient;

	constructor(
		private readonly reflector: Reflector,
		private readonly configService: ConfigService,
		private readonly db: DbService,
	) {
		// Use cached client or create new one
		if (!supabaseClient) {
			const supabaseUrl = this.configService.getOrThrow(
				"supabase.url",
			) as string;
			const serviceRoleKey = this.configService.getOrThrow(
				"supabase.serviceRoleKey",
			) as string;

			supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
				auth: {
					autoRefreshToken: false,
					persistSession: false,
				},
			});
		}
		this.supabase = supabaseClient;
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
			throw new AppError("AUTH.MISSING_TOKEN");
		}

		const token = authHeader.substring(7);

		try {
			// Verify the token using Supabase's getUser() API
			const {
				data: { user },
				error,
			} = await this.supabase.auth.getUser(token);

			if (error || !user) {
				throw new AppError("AUTH.INVALID_TOKEN");
			}

			// Check DB status to prevent deactivated users from authenticating
			try {
				const dbUser = await this.db.user.findUnique({
					where: { id: user.id },
					select: { status: true },
				});

				if (dbUser?.status === "deactivated") {
					throw new AppError("AUTH.DEACTIVATED_ACCOUNT");
				}
			} catch (err) {
				if (err instanceof AppError) throw err;
				console.error("AuthGuard DB check error:", err);
				throw new AppError("AUTH.TOKEN_VERIFICATION_FAILED");
			}

			// Attach the Supabase user to the request
			// RolesGuard will enrich this with DB user data (role, status, etc.)
			(request as RequestWithUser).user = user;

			return true;
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}
			throw new AppError("AUTH.TOKEN_VERIFICATION_FAILED");
		}
	}
}

export type AuthenticatedUser = SupabaseUser;

interface RequestWithUser {
	user?: SupabaseUser;
}
