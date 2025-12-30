export default () => ({
	port: parseInt(process.env.PORT ?? 8080, 10),
	database: {
		url: process.env.DATABASE_URL,
	},
	supabase: {
		url: process.env.SUPABASE_URL,
		serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
	},
	// add config values/envs here
});
