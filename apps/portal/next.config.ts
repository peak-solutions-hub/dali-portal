import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	transpilePackages: ["@repo/ui"],
	htmlLimitedBots:
		/Chrome-Lighthouse|Lighthouse|facebookexternalhit|Twitterbot|Slackbot|Bingbot/i,
	output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
};

export default nextConfig;
