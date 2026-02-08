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
	// captcha
	turnstile: {
		secretKey: process.env.TURNSTILE_SECRET_KEY,
		timeout: 10000,
		// abort request if it takes longer than 10s
	},
	// email service
	resend: { apiKey: process.env.RESEND_API_KEY },
	// supabase
	supabase: {
		url: process.env.SUPABASE_URL,
		serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
	},
	portalUrl: process.env.PORTAL_URL ?? "http://localhost:3000",
	adminUrl: process.env.ADMIN_URL ?? "http://localhost:3001",
});
