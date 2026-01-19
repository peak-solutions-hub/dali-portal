// Module
export { AuthModule } from "./auth.module";
// Decorators
export { CurrentUser } from "./decorators/current-user.decorator";
export { Public } from "./decorators/public.decorator";
export { ROLES_KEY, Roles } from "./decorators/roles.decorator";
// Guards
export { JwtAuthGuard } from "./guards/jwt-auth.guard";
export { RolesGuard } from "./guards/roles.guard";

// Types
export type {
	AuthenticatedUser,
	SupabaseJwtPayload,
} from "./strategies/supabase-jwt.strategy";
