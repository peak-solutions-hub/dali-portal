import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ORPCError } from "@orpc/nest";
import { AppError, type RoleType } from "@repo/shared";
import { ExtractJwt, Strategy } from "passport-jwt";
import { DbService } from "@/app/db/db.service";
import { ConfigService } from "@/lib/config.service";

export interface SupabaseJwtPayload {
	sub: string;
	email?: string;
	phone?: string;
	app_metadata?: Record<string, unknown>;
	user_metadata?: Record<string, unknown>;
	role?: string;
	aat?: number;
	iss?: string;
	iat?: number;
	exp?: number;
}

interface CachedUserData {
	id: string;
	email: string;
	fullName: string;
	roleName: RoleType;
	status: string;
	cachedAt: number;
}

const userCache = new Map<string, CachedUserData>();
const CACHE_TTL_MS = 60_000;
const inflightRequests = new Map<string, Promise<CachedUserData | null>>();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	private readonly logger = new Logger(JwtStrategy.name);

	constructor(
		configService: ConfigService,
		private readonly db: DbService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: configService.getOrThrow("supabase.jwtSecret") as string,
			algorithms: ["HS256"],
		});
	}

	private getUserData(userId: string): Promise<CachedUserData | null> {
		const cached = userCache.get(userId);
		if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
			return Promise.resolve(cached);
		}

		const inflight = inflightRequests.get(userId);
		if (inflight) return inflight;

		const fetchPromise = this.db.user
			.findUnique({
				where: { id: userId },
				select: {
					id: true,
					email: true,
					fullName: true,
					role: { select: { name: true } },
					status: true,
				},
			})
			.then((dbUser) => {
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
			})
			.finally(() => {
				inflightRequests.delete(userId);
			});

		inflightRequests.set(userId, fetchPromise);
		return fetchPromise;
	}

	async validate(payload: SupabaseJwtPayload) {
		if (!payload.sub) {
			this.logger.warn("Auth failed: JWT missing sub claim");
			throw new AppError("AUTH.INVALID_TOKEN");
		}

		const userData = await this.getUserData(payload.sub);
		if (!userData) {
			this.logger.warn(
				`Auth failed: user not found for supabaseId=${payload.sub}`,
			);
			throw new AppError("USER.NOT_FOUND");
		}

		if (userData.status === "deactivated") {
			userCache.delete(payload.sub);
			this.logger.warn(
				`Auth blocked: deactivated account userId=${userData.id} email=${userData.email}`,
			);
			throw new ORPCError("DEACTIVATED_ACCOUNT", {
				status: 401,
				message: "User account is deactivated.",
			});
		}

		return {
			id: userData.id,
			email: userData.email,
			fullName: userData.fullName,
			role: userData.roleName,
			status: userData.status,
			sub: payload.sub,
			app_metadata: payload.app_metadata,
			user_metadata: payload.user_metadata,
		};
	}

	static invalidateUserCache(userId: string): void {
		userCache.delete(userId);
	}

	static clearCache(): void {
		userCache.clear();
	}
}
