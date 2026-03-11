import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.test" });

export default defineConfig({
	schema: "src/app/db/schema.prisma",
	migrations: {
		path: "src/app/db/migrations",
	},
	datasource: { url: process.env.DATABASE_URL },
});
