import type { MetadataRoute } from "next";

import { api } from "@/lib/api.client";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	// Static pages
	const staticRoutes: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${baseUrl}/council-members`,
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/inquiries`,
			changeFrequency: "monthly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/legislative-documents`,
			changeFrequency: "weekly",
			priority: 0.9,
		},
		{
			url: `${baseUrl}/sessions`,
			changeFrequency: "weekly",
			priority: 0.9,
		},
	];

	// Dynamic legislative document pages
	const documentRoutes: MetadataRoute.Sitemap = [];
	try {
		let page = 1;
		const limit = 100;

		while (true) {
			const [error, data] = await api.legislativeDocuments.list({
				limit,
				page,
			});

			if (error) {
				console.error("[sitemap] legislativeDocuments.list failed", {
					page,
					limit,
					error: error.message,
				});
				break;
			}

			if (!data?.documents?.length) {
				break;
			}

			documentRoutes.push(
				...data.documents.map((doc) => ({
					url: `${baseUrl}/legislative-documents/${doc.id}`,
					lastModified: new Date(doc.createdAt),
					changeFrequency: "monthly" as const,
					priority: 0.6,
				})),
			);

			if (!data.pagination?.hasNextPage) {
				break;
			}

			page += 1;
		}
	} catch {
		console.error("[sitemap] Failed to collect legislative document routes");
	}

	// Dynamic session pages
	const sessionRoutes: MetadataRoute.Sitemap = [];
	try {
		let page = 1;
		const limit = 100;

		while (true) {
			const [error, data] = await api.sessions.list({
				sortBy: "date",
				sortDirection: "desc",
				limit,
				page,
			});

			if (error) {
				console.error("[sitemap] sessions.list failed", {
					page,
					limit,
					error: error.message,
				});
				break;
			}

			if (!data?.sessions?.length) {
				break;
			}

			sessionRoutes.push(
				...data.sessions.map((session) => ({
					url: `${baseUrl}/sessions/${session.id}`,
					lastModified: new Date(session.scheduleDate),
					changeFrequency: "monthly" as const,
					priority: 0.6,
				})),
			);

			if (!data.pagination?.hasNextPage) {
				break;
			}

			page += 1;
		}
	} catch {
		console.error("[sitemap] Failed to collect session routes");
	}

	return [...staticRoutes, ...documentRoutes, ...sessionRoutes];
}
