import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { DbService } from "@/app/db/db.service";
import { ConfigService } from "@/lib/config.service";

/**
 * JWT payload from Supabase Auth
 */
export interface SupabaseJwtPayload {
	/** Supabase Auth user ID (UUID) */
	sub: string;
	/** User email */
	email?: string;
	/** Token issued at timestamp */
	iat: number;
	/** Token expiration timestamp */
	exp: number;
	/** Audience */
	aud: string;
	/** Role (typically 'authenticated') */
	role?: string;
}

/**
 * Authenticated user attached to the request
 */
export interface AuthenticatedUser {
	/** User ID from public.user table (same as Supabase Auth user ID) */
	id: string;
	/** User email */
	email: string;
	/** User full name */
	fullName: string;
	/** User role name (e.g., 'it_admin', 'admin_staff') */
	role: string;
	/** User status */
	status: string;
}

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(
	Strategy,
	"supabase-jwt",
) {
	constructor(
		configService: ConfigService,
		private readonly db: DbService,
	) {
		const jwtSecret = configService.getOrThrow("supabase.jwtSecret") as string;

		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtSecret,
			algorithms: ["HS256"],
		});
	}

	/**
	 * Validates the JWT payload and fetches the user from the database.
	 * This is called automatically by Passport after JWT verification.
	 *
	 * @param payload - Decoded JWT payload from Supabase
	 * @returns The authenticated user object attached to request.user
	 * @throws UnauthorizedException if user not found or deactivated
	 */
	async validate(payload: SupabaseJwtPayload): Promise<AuthenticatedUser> {
		const userId = payload.sub;

		if (!userId) {
			throw new UnauthorizedException("Invalid token: missing user ID");
		}

		// Fetch user with role from database
		const user = await this.db.user.findUnique({
			where: { id: userId },
			include: { role: true },
		});

		if (!user) {
			throw new UnauthorizedException("User not found");
		}

		// Check if user is deactivated
		if (user.status === "deactivated") {
			throw new UnauthorizedException("User account is deactivated");
		}

		// Return the authenticated user object
		return {
			id: user.id,
			email: user.email,
			fullName: user.fullName,
			role: user.role.name,
			status: user.status,
		};
	}
}
