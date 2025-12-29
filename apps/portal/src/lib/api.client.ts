import { createORPCClient, createSafeClient, safe } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import type { JsonifiedClient } from "@orpc/openapi-client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { type Contract, contract } from "@repo/shared";

const link = new OpenAPILink(contract, {
	url: `${process.env.NEXT_PUBLIC_API_URL}`,
	headers: () => ({}),
});

const jsonApi: JsonifiedClient<ContractRouterClient<Contract>> =
	createORPCClient(link);

export const api = createSafeClient(jsonApi);
