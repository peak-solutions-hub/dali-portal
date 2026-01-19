import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedUser } from "../strategies/supabase-jwt.strategy";

/**
 * Parameter decorator to extract the current authenticated user from the request.
 * Must be used in routes protected by JwtAuthGuard.
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return user;
 * }
 *
 * // Or extract a specific property
 * @Get('profile')
 * getProfile(@CurrentUser('id') userId: string) {
 *   return userId;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
	(data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const user = request.user as AuthenticatedUser;

		if (!user) {
			return null;
		}

		return data ? user[data] : user;
	},
);
