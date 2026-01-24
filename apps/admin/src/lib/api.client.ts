import { createORPCClient, createSafeClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import type { JsonifiedClient } from "@orpc/openapi-client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { type Contract, contract } from "@repo/shared";

// Default to localhost:8080 for development
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const link = new OpenAPILink(contract, {
	url: apiUrl,
	headers: () => ({}),
});

const jsonApi: JsonifiedClient<ContractRouterClient<Contract>> =
	createORPCClient(link);

export const api = createSafeClient(jsonApi);
