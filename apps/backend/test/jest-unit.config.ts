import type { Config } from "jest";

const config: Config = {
	moduleFileExtensions: ["js", "json", "ts"],
	rootDir: "../src",
	testEnvironment: "node",
	testRegex: "^((?!integration-spec).)*\\.spec\\.ts$",
	transform: {
		"^.+\\.(t|j)s$": "ts-jest",
	},
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/$1",
	},
};

export default config;
