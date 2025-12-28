export default () => ({
	port: parseInt(process.env.PORT, 10),
	database: {
		url: process.env.DATABASE_URL,
	},
	// add config values/envs here
});
