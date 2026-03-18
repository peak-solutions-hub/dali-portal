import buildConfig from "@/config";

describe("config", () => {
	it("provides expected defaults when env vars are missing", () => {
		const env = process.env as Record<string, string | undefined>;
		const prevPort = process.env.PORT;
		const prevCors = process.env.CORS_ORIGINS;
		const prevThrottleLimit = process.env.THROTTLE_LIMIT;
		const prevThrottleTtl = process.env.THROTTLE_TTL;

		delete env.PORT;
		delete env.CORS_ORIGINS;
		delete env.THROTTLE_LIMIT;
		delete env.THROTTLE_TTL;

		const config = buildConfig();

		expect(config.port).toBe(8080);
		expect(config.corsOrigins).toBe(
			"http://localhost:3000,http://localhost:3001",
		);
		expect(config.throttle.limit).toBe(100);
		expect(config.throttle.ttl).toBe(60000);

		if (prevPort === undefined) {
			delete env.PORT;
		} else {
			env.PORT = prevPort;
		}

		if (prevCors === undefined) {
			delete env.CORS_ORIGINS;
		} else {
			env.CORS_ORIGINS = prevCors;
		}

		if (prevThrottleLimit === undefined) {
			delete env.THROTTLE_LIMIT;
		} else {
			env.THROTTLE_LIMIT = prevThrottleLimit;
		}

		if (prevThrottleTtl === undefined) {
			delete env.THROTTLE_TTL;
		} else {
			env.THROTTLE_TTL = prevThrottleTtl;
		}
	});
});
