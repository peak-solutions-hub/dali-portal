import {
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

/**
 * Guard that validates JWT tokens from Supabase Auth.
 * Uses the SupabaseJwtStrategy for token validation.
 *
 * Routes marked with @Public() decorator will bypass this guard.
 *
 * @example
 * ```typescript
 * // Apply to a single route
 * @UseGuards(JwtAuthGuard)
 * @Get('protected')
 * protectedRoute() { ... }
 *
 * // Apply globally in module
 * providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }]
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("supabase-jwt") {
	constructor(private reflector: Reflector) {
		super();
	}

	canActivate(context: ExecutionContext) {
		// Check if route is marked as public
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (isPublic) {
			return true;
		}

		return super.canActivate(context);
	}

	handleRequest<TUser>(
		err: Error | null,
		user: TUser,
		info: Error | null,
	): TUser {
		if (err || !user) {
			throw err || new UnauthorizedException("Invalid or expired token");
		}
		return user;
	}
}
