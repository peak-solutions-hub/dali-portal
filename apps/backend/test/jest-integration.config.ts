import type { Config } from "jest";

const config: Config = {
	moduleFileExtensions: ["js", "json", "ts"],
	rootDir: ".",
	testEnvironment: "node",
	testRegex: ".integration-spec.ts$",
	setupFilesAfterEnv: ["<rootDir>/setup-integration.ts"],
	transform: {
		"^.+\\.(t|j)s$": "ts-jest",
	},
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
		"^@/generated/(.*)$": "<rootDir>/../generated/$1",
		"^@/(.*)$": "<rootDir>/../src/$1",
		"^@repo/shared$": "<rootDir>/../../../packages/shared/src/index.ts",
		"^@repo/shared/(.*)$": "<rootDir>/../../../packages/shared/src/$1",
	},
};

export default config;
