import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	transpilePackages: ["@repo/ui"],
	htmlLimitedBots:
		/Chrome-Lighthouse|Lighthouse|facebookexternalhit|Twitterbot|Slackbot|Bingbot/i,
	output: "standalone",
};

export default nextConfig;
