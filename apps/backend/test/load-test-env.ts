import { config } from "dotenv";

let hasLoaded = false;

export function loadTestEnv(): void {
	if (hasLoaded) {
		return;
	}

	config({ path: ".env.test", override: true });
	hasLoaded = true;
}
