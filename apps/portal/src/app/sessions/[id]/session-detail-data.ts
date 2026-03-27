import { isDefinedError } from "@orpc/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { api } from "@/lib/api.client";

const SESSION_ID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CachedSessionDetailResult {
	data: Awaited<ReturnType<typeof api.sessions.getById>>[1] | null;
	error: {
		defined: boolean;
		code?: string;
		message: string;
	} | null;
}

export function isValidSessionId(id: string): boolean {
	return SESSION_ID_REGEX.test(id);
}

const getSessionByIdWithDataCache = unstable_cache(
	async (id: string): Promise<CachedSessionDetailResult> => {
		const [error, data] = await api.sessions.getById({ id });

		if (error) {
			if (isDefinedError(error)) {
				return {
					data: null,
					error: {
						defined: true,
						code: error.code,
						message: error.message,
					},
				};
			}

			return {
				data: null,
				error: {
					defined: false,
					message: error.message,
				},
			};
		}

		return {
			data,
			error: null,
		};
	},
	["session-detail"],
	{
		revalidate: 300,
		tags: ["sessions"],
	},
);

export const getCachedSessionById = cache((id: string) => {
	return getSessionByIdWithDataCache(id);
});
