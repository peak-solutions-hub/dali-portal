import type { MetadataRoute } from "next";

import { api } from "@/lib/api.client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	// Static pages
	const staticRoutes: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${baseUrl}/council-members`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${baseUrl}/inquiries`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.7,
		},
		{
			url: `${baseUrl}/legislative-documents`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.9,
		},
		{
			url: `${baseUrl}/sessions`,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.9,
		},
	];

	// Dynamic legislative document pages
	let documentRoutes: MetadataRoute.Sitemap = [];
	try {
		const [error, data] = await api.legislativeDocuments.list({
			limit: 100,
			page: 1,
		});

		if (!error && data?.documents) {
			documentRoutes = data.documents.map((doc) => ({
				url: `${baseUrl}/legislative-documents/${doc.id}`,
				lastModified: new Date(doc.createdAt),
				changeFrequency: "monthly" as const,
				priority: 0.6,
			}));
		}
	} catch {
		// Silently continue — sitemap will still include static routes
	}

	// Dynamic session pages
	let sessionRoutes: MetadataRoute.Sitemap = [];
	try {
		const [error, data] = await api.sessions.list({
			limit: 100,
			page: 1,
		});

		if (!error && data?.sessions) {
			sessionRoutes = data.sessions.map((session) => ({
				url: `${baseUrl}/sessions/${session.id}`,
				lastModified: new Date(session.scheduleDate),
				changeFrequency: "monthly" as const,
				priority: 0.6,
			}));
		}
	} catch {
		// Silently continue
	}

	return [...staticRoutes, ...documentRoutes, ...sessionRoutes];
}
