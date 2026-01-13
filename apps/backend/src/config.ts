export default () => ({
	port: parseInt(process.env.PORT ?? "8080", 10),
	database: {
		url: process.env.DATABASE_URL,
	},
	// env looks like "http://localhost:3000,http://localhost:3001"
	corsOrigins:
		process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3001",
});
