import { createPublicKey } from "node:crypto";
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
const MAX_CACHE_ENTRIES = 1_000;
const inflightRequests = new Map<string, Promise<CachedUserData | null>>();
const ES256_KEY_CACHE_TTL_MS = 5 * 60_000;

type CachedEs256Key = {
	keyPem: string;
	expiresAt: number;
};

type JwkKey = {
	kid: string;
	kty: string;
	alg?: string;
	use?: string;
	x?: string;
	y?: string;
	crv?: string;
};

const pruneExpiredUserCache = (now = Date.now()): void => {
	for (const [userId, cached] of userCache.entries()) {
		if (now - cached.cachedAt >= CACHE_TTL_MS) {
			userCache.delete(userId);
		}
	}
};

const enforceUserCacheLimit = (): void => {
	const excessEntries = userCache.size - MAX_CACHE_ENTRIES;
	if (excessEntries <= 0) return;

	const oldestEntries = Array.from(userCache.entries())
		.sort(([, left], [, right]) => left.cachedAt - right.cachedAt)
		.slice(0, excessEntries);

	for (const [userId] of oldestEntries) {
		userCache.delete(userId);
	}
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	private readonly logger = new Logger(JwtStrategy.name);
	private readonly supabaseUrl: string;
	private readonly es256KeyCache = new Map<string, CachedEs256Key>();

	constructor(
		configService: ConfigService,
		private readonly db: DbService,
	) {
		const hs256Secret = configService.getOrThrow(
			"supabase.jwtSecret",
		) as string;
		const supabaseUrl = configService.getOrThrow("supabase.url") as string;

		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKeyProvider: async (_request, rawJwtToken, done) => {
				try {
					const [encodedHeader] = rawJwtToken.split(".");
					if (!encodedHeader) {
						return done(
							new Error("Invalid JWT: missing header segment"),
							undefined,
						);
					}

					const header = JSON.parse(
						Buffer.from(encodedHeader, "base64url").toString("utf-8"),
					) as { alg?: string; kid?: string };

					if (header.alg === "HS256") {
						return done(null, hs256Secret);
					}

					if (header.alg === "ES256") {
						if (!header.kid) {
							return done(
								new Error("Invalid JWT: ES256 token missing kid"),
								undefined,
							);
						}

						const keyPem = await this.getEs256Key(header.kid);
						return done(null, keyPem);
					}

					return done(
						new Error(`Unsupported JWT algorithm: ${header.alg ?? "unknown"}`),
						undefined,
					);
				} catch (error) {
					return done(error as Error, undefined);
				}
			},
			algorithms: ["HS256", "ES256"],
		});

		this.supabaseUrl = supabaseUrl.replace(/\/$/, "");
	}

	private async getEs256Key(kid: string): Promise<string> {
		const cached = this.es256KeyCache.get(kid);
		if (cached && cached.expiresAt > Date.now()) {
			return cached.keyPem;
		}

		const jwksUrl = `${this.supabaseUrl}/auth/v1/.well-known/jwks.json`;
		const response = await fetch(jwksUrl, { cache: "no-store" });
		if (!response.ok) {
			throw new Error(`Unable to fetch Supabase JWKS (${response.status})`);
		}

		const jwks = (await response.json()) as { keys?: JwkKey[] };
		const jwk = (jwks.keys ?? []).find((key) => key.kid === kid);
		if (!jwk) {
			throw new Error(`Supabase JWKS key not found for kid=${kid}`);
		}

		const key = createPublicKey({
			key: jwk as unknown as import("node:crypto").JsonWebKey,
			format: "jwk",
		});
		const keyPem = key.export({ type: "spki", format: "pem" }).toString();
		this.es256KeyCache.set(kid, {
			keyPem,
			expiresAt: Date.now() + ES256_KEY_CACHE_TTL_MS,
		});

		return keyPem;
	}

	private getUserData(
		userId: string,
		email?: string,
	): Promise<CachedUserData | null> {
		pruneExpiredUserCache();

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
			.then(async (dbUser) => {
				let resolvedUser = dbUser;

				// Fallback for legacy/misaligned data where auth `sub` doesn't match `users.id`.
				if (!resolvedUser && email) {
					resolvedUser = await this.db.user.findFirst({
						where: { email },
						select: {
							id: true,
							email: true,
							fullName: true,
							role: { select: { name: true } },
							status: true,
						},
					});

					if (resolvedUser) {
						this.logger.warn(
							`Auth user id mismatch: token sub=${userId}, matched local user by email=${email} using id=${resolvedUser.id}`,
						);
					}
				}

				if (!resolvedUser) {
					userCache.delete(userId);
					return null;
				}
				const userData: CachedUserData = {
					id: resolvedUser.id,
					email: resolvedUser.email,
					fullName: resolvedUser.fullName,
					roleName: resolvedUser.role.name as RoleType,
					status: resolvedUser.status,
					cachedAt: Date.now(),
				};
				userCache.set(userId, userData);
				if (resolvedUser.id !== userId) {
					userCache.set(resolvedUser.id, userData);
				}
				enforceUserCacheLimit();
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

		const userData = await this.getUserData(payload.sub, payload.email);
		if (!userData) {
			this.logger.warn(
				`Auth failed: user not found for supabaseId=${payload.sub}`,
			);
			throw new AppError("USER.NOT_FOUND");
		}

		if (userData.status === "deactivated") {
			userCache.delete(payload.sub);
			this.logger.warn(
				`Auth blocked: deactivated account userId=${userData.id} supabaseId=${payload.sub}`,
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
