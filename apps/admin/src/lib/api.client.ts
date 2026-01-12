import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import type { JsonifiedClient } from "@orpc/openapi-client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { type Contract, contract } from "@repo/shared";

const apiUrl =
	process.env.NEXT_PUBLIC_API_URL ??
	(process.env.NODE_ENV === "development"
		? "http://localhost:8080"
		: undefined);

console.log("API URL:", apiUrl);

if (!apiUrl) {
	throw new Error(
		"Missing NEXT_PUBLIC_API_URL — set this environment variable for production deployments",
	);
}

const link = new OpenAPILink(contract, {
	url: apiUrl,
	headers: () => ({}),
});

export const api: JsonifiedClient<ContractRouterClient<Contract>> =
	createORPCClient(link);
