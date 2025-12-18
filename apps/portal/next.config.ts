import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	transpilePackages: ["@repo/ui"],
	output: "standalone",
};

export default nextConfig;
