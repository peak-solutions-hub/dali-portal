import { isDefinedError } from "@orpc/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { api } from "@/lib/api.client";

export interface CachedDocumentDetailResult {
	data: Awaited<ReturnType<typeof api.legislativeDocuments.getById>>[1] | null;
	error: {
		defined: boolean;
		code?: string;
		message: string;
	} | null;
}

export function parseLegislativeDocumentId(id: string): number | null {
	const idNum = Number(id);
	if (!Number.isFinite(idNum) || idNum <= 0) {
		return null;
	}

	return idNum;
}

const getLegislativeDocumentByIdWithDataCache = unstable_cache(
	async (id: number): Promise<CachedDocumentDetailResult> => {
		const [error, data] = await api.legislativeDocuments.getById({ id });

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
	["legislative-document-detail"],
	{
		revalidate: 300,
		tags: ["legislative-documents"],
	},
);

export const getCachedLegislativeDocumentById = cache((id: number) => {
	return getLegislativeDocumentByIdWithDataCache(id);
});
