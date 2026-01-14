declare namespace NodeJS {
	interface ProcessEnv {
		PORT: string;
		DATABASE_URL: string;
		CORS_ORIGINS?: string;

		// rate limiting config
		THROTTLE_TTL?: string;
		THROTTLE_LIMIT?: string;

		// turnstile
		TURNSTILE_SECRET_KEY: string;
	}
}
