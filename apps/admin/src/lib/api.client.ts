import { createORPCClient, createSafeClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import type { JsonifiedClient } from "@orpc/openapi-client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { type Contract, contract } from "@repo/shared";

const apiUrl =
	process.env.NEXT_PUBLIC_API_URL ??
	(process.env.NODE_ENV === "development"
		? "http://localhost:8080"
		: undefined);

if (!apiUrl) {
	throw new Error(
		"Missing NEXT_PUBLIC_API_URL — set this environment variable for production deployments",
	);
}

/**
 * Store for the current auth token
 * This is set by the auth store when a session is established
 */
let authToken: string | null = null;

/**
 * Set the auth token for API requests
 * @param token - JWT token from Supabase session, or null to clear
 */
export function setAuthToken(token: string | null) {
	authToken = token;
}

/**
 * Get the current auth token
 * @returns The current JWT token or null
 */
export function getAuthToken(): string | null {
	return authToken;
}

const link = new OpenAPILink(contract, {
	url: apiUrl,
	headers: () => {
		const headers: Record<string, string> = {};

		if (authToken) {
			headers.Authorization = `Bearer ${authToken}`;
		}

		return headers;
	},
});

const jsonApi: JsonifiedClient<ContractRouterClient<Contract>> =
	createORPCClient(link);

export const api = createSafeClient(jsonApi);
export const orpc = createTanstackQueryUtils(jsonApi);
