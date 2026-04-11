import { beforeAll } from "@jest/globals";
import { loadTestEnv } from "./load-test-env";

beforeAll(() => {
	loadTestEnv();
});
