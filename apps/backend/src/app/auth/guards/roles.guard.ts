import {
	type ExecutionContext,
	ForbiddenException,
	Injectable,
	Logger,
	UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { ROLE_PERMISSIONS, type RoleType } from "@repo/shared";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { JwtStrategy } from "../strategies/jwt.strategy";

export interface EnrichedUser {
	id: string;
	email: string;
	fullName: string;
	role: RoleType;
	status: string;
	sub: string;
	app_metadata?: Record<string, unknown>;
	user_metadata?: Record<string, unknown>;
}

@Injectable()
export class RolesGuard extends AuthGuard("jwt") {
	private readonly logger = new Logger(RolesGuard.name);

	constructor(private readonly reflector: Reflector) {
		super();
	}

	static invalidateUserCache(userId: string): void {
		JwtStrategy.invalidateUserCache(userId);
	}

	static clearCache(): void {
		JwtStrategy.clearCache();
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Get required roles from decorator
		const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()],
		);

		const request = context.switchToHttp().getRequest<{
			method?: string;
			path?: string;
			url?: string;
		}>();
		const requestPath = request.path ?? request.url ?? "";
		const isRolesListRoute =
			request.method === "GET" && requestPath.startsWith("/roles");
		const effectiveRequiredRoles =
			requiredRoles && requiredRoles.length > 0
				? requiredRoles
				: isRolesListRoute
					? ROLE_PERMISSIONS.ROLES_MANAGEMENT
					: undefined;

		// If no roles are required, allow access (public route)
		if (!effectiveRequiredRoles || effectiveRequiredRoles.length === 0) {
			return true;
		}

		// Roles are required - authenticate the user via Passport JWT Strategy
		const canActivate = await super.canActivate(context);
		if (!canActivate) {
			return false;
		}

		const authenticatedRequest = context.switchToHttp().getRequest();
		const user = authenticatedRequest.user as EnrichedUser;

		// Check if user has one of the required roles
		const hasRequiredRole = effectiveRequiredRoles.some(
			(role) => role === user.role,
		);

		if (!hasRequiredRole) {
			this.logger.warn(
				`Auth blocked: insufficient permissions userId=${user.id} role=${user.role}`,
			);
			throw new ForbiddenException("Access denied. Insufficient permissions.");
		}

		return true;
	}

	handleRequest(
		// biome-ignore lint/suspicious/noExplicitAny: interface requirement
		err: any,
		// biome-ignore lint/suspicious/noExplicitAny: interface requirement
		user: any,
		// biome-ignore lint/suspicious/noExplicitAny: interface requirement
		info: any,
		context: ExecutionContext,
		// biome-ignore lint/suspicious/noExplicitAny: interface requirement
		status?: any,
	) {
		if (err || !user) {
			this.logger.warn(
				`Auth failed: ${(err as Error)?.message || (info as Error)?.message || "Unauthorized"}`,
			);
			throw err || new UnauthorizedException("Authentication required.");
		}
		return user;
	}
}
