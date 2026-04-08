import type { Config } from "jest";

const config: Config = {
	moduleFileExtensions: ["js", "json", "ts"],
	rootDir: "../src",
	testEnvironment: "node",
	testRegex: "^((?!integration-spec).)*\\.spec\\.ts$",
	extensionsToTreatAsEsm: [".ts"],
	transform: {
		"^.+\\.(t|j)s$": [
			"ts-jest",
			{ useESM: true, tsconfig: "<rootDir>/../test/tsconfig.jest.json" },
		],
	},
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
		"^@/generated/(.*)$": "<rootDir>/../generated/$1",
		"^generated/(.*)$": "<rootDir>/../generated/$1",
		"^@/(.*)$": "<rootDir>/$1",
		"^@repo/shared$": "<rootDir>/../../../packages/shared/src/index.ts",
		"^@repo/shared/(.*)$": "<rootDir>/../../../packages/shared/src/$1",
	},
};

export default config;
