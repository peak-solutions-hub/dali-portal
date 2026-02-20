import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { EnrichedUser } from "../guards/roles.guard";

/**
 * Parameter decorator to extract the current authenticated user from the request.
 * Must be used in routes protected by AuthGuard (and optionally RolesGuard).
 *
 * The user object contains:
 * - Supabase Auth fields (id, email, app_metadata, user_metadata, etc.)
 * - DB enriched fields (fullName, role, status) - available after RolesGuard runs
 *
 * @example
 * ```typescript
 * @UseGuards(AuthGuard, RolesGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: EnrichedUser) {
 *   return { id: user.id, role: user.role, fullName: user.fullName };
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
	(data: keyof EnrichedUser | undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const user = request.user as EnrichedUser;

		if (!user) {
			return null;
		}

		return data ? user[data] : user;
	},
);
