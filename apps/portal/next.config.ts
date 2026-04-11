import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	transpilePackages: ["@repo/ui"],
	allowedDevOrigins: [
		"http://127.0.0.1:3000",
		"http://127.0.0.1:3001",
		"http://localhost:3000",
		"http://localhost:3001",
	],
	htmlLimitedBots:
		/Chrome-Lighthouse|Lighthouse|facebookexternalhit|Twitterbot|Slackbot|Bingbot/i,
	output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
};

export default nextConfig;
