export default () => ({
	port: parseInt(process.env.PORT ?? "8080", 10),
	database: {
		url: process.env.DATABASE_URL,
	},
	// env looks like "http://localhost:3000,http://localhost:3001"
	corsOrigins:
		process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3001",
	supabase: {
		url: process.env.SUPABASE_URL,
		serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
		jwtSecret: process.env.SUPABASE_JWT_SECRET,
	},
	adminUrl: process.env.ADMIN_URL ?? "http://localhost:3001",
});
