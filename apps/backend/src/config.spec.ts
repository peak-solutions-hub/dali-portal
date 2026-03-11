import buildConfig from "@/config";

describe("config", () => {
	it("provides expected defaults when env vars are missing", () => {
		const env = process.env as Record<string, string | undefined>;
		const prevPort = process.env.PORT;
		const prevCors = process.env.CORS_ORIGINS;
		const prevThrottleLimit = process.env.THROTTLE_LIMIT;
		const prevThrottleTtl = process.env.THROTTLE_TTL;

		env.PORT = undefined;
		env.CORS_ORIGINS = undefined;
		env.THROTTLE_LIMIT = undefined;
		env.THROTTLE_TTL = undefined;

		const config = buildConfig();

		expect(config.port).toBe(8080);
		expect(config.corsOrigins).toBe(
			"http://localhost:3000,http://localhost:3001",
		);
		expect(config.throttle.limit).toBe(100);
		expect(config.throttle.ttl).toBe(60000);

		process.env.PORT = prevPort;
		process.env.CORS_ORIGINS = prevCors;
		process.env.THROTTLE_LIMIT = prevThrottleLimit;
		process.env.THROTTLE_TTL = prevThrottleTtl;
	});
});
