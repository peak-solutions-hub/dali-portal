export default () => ({
	port: parseInt(process.env.PORT ?? "8080", 10),
	database: {
		url: process.env.DATABASE_URL,
	},
	// env looks like "http://localhost:3000,http://localhost:3001"
	corsOrigins:
		process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3001",
	// Rate limiting configuration
	throttle: {
		// default rate limit: 100 requests per min
		ttl: process.env.THROTTLE_TTL ?? 60000,
		limit: process.env.THROTTLE_LIMIT ?? 100,
	},
	turnstile_secret_key: process.env.TURNSTILE_SECRET_KEY,
	resend: { apiKey: process.env.RESEND_API_KEY },
});
