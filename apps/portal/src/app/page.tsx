import { isDefinedError } from "@orpc/client";
import {
	formatDateInPHT,
	formatIsoDateInPHT,
	formatSessionDate,
	formatSessionTime,
	parseDateInput,
	transformDocumentListDates,
	transformSessionListDates,
} from "@repo/shared";
import type { Metadata } from "next";
import {
	AboutSection,
	HeroSection,
	QuickActions,
	RecentUpdates,
} from "@/components/home";
import { api } from "@/lib/api.client";
import {
	createPageMetadata,
	SITE_DESCRIPTION,
	SITE_TITLE,
} from "@/lib/seo-metadata";

export const metadata: Metadata = createPageMetadata({
	title: SITE_TITLE,
	description: SITE_DESCRIPTION,
	url: "/",
	imagePath: "/opengraph-image",
});

export const revalidate = 300;

export default async function HomePage() {
	// Fetch statistics
	const [statsError, stats] = await api.legislativeDocuments.statistics({});
	const approvedOrdinances = stats?.totalOrdinances ?? 0;
	const approvedResolutions = stats?.totalResolutions ?? 0;

	if (statsError && isDefinedError(statsError)) {
		console.error("Failed to fetch statistics:", statsError.message);
	}

	// Fetch latest documents
	const [latestDocsError, latestDocsResponse] =
		await api.legislativeDocuments.latest({
			limit: 5,
		});

	let latestDocumentsSource = latestDocsResponse?.documents;

	if (latestDocsError) {
		if (isDefinedError(latestDocsError)) {
			console.error(
				"Failed to fetch latest documents:",
				latestDocsError.message,
			);
		} else {
			console.error("Failed to fetch latest documents:", latestDocsError);
		}

		// Production fallback for environments where /latest may be unavailable or transiently failing.
		const [fallbackError, fallbackResponse] =
			await api.legislativeDocuments.list({
				page: 1,
				limit: 5,
			});

		if (fallbackError) {
			console.error("Fallback latest documents fetch failed:", fallbackError);
		} else {
			latestDocumentsSource = fallbackResponse?.documents;
		}
	}

	// Transform documents and map to the format expected by RecentUpdates
	const latestDocuments = latestDocumentsSource
		? transformDocumentListDates(latestDocumentsSource).map((doc) => {
				const dateEnacted = parseDateInput(doc.dateEnacted);
				const month = formatDateInPHT(dateEnacted, { month: "short" });
				const day = formatDateInPHT(dateEnacted, { day: "numeric" });
				const fullDate = formatDateInPHT(dateEnacted, {
					month: "long",
					day: "numeric",
					year: "numeric",
				});

				return {
					id: String(doc.id),
					number: doc.officialNumber,
					title: doc.displayTitle || doc.document.title,
					type:
						doc.type === "ordinance"
							? ("Ordinance" as const)
							: ("Resolution" as const),
					month,
					day,
					fullDate,
					author: doc.authorNames?.[0] ?? undefined,
				};
			})
		: [];
	// Fetch upcoming sessions (next 3)
	const [sessionsError, sessionsResponse] = await api.sessions.list({
		dateFrom: new Date(),
		status: "scheduled",
		sortBy: "date",
		sortDirection: "asc",
		limit: 3,
		page: 1,
	});

	if (sessionsError && isDefinedError(sessionsError)) {
		console.error("Failed to fetch upcoming sessions:", sessionsError.message);
	}

	const now = new Date();

	const upcomingSessions = sessionsResponse?.sessions
		? transformSessionListDates(sessionsResponse.sessions)
				.filter((session) => {
					const scheduleDate = parseDateInput(session.scheduleDate);
					return scheduleDate >= now;
				})
				.slice(0, 3)
				.map((s) => {
					const scheduleDate = parseDateInput(s.scheduleDate);
					const month = formatDateInPHT(scheduleDate, { month: "short" });
					const day = formatDateInPHT(scheduleDate, {
						day: "2-digit",
					});
					const weekday = formatDateInPHT(scheduleDate, {
						weekday: "long",
					});
					const fullDate = formatSessionDate(scheduleDate);
					const time = formatSessionTime(scheduleDate);

					return {
						id: s.id,
						type: s.type,
						sessionNumber: String(s.sessionNumber),
						date: formatIsoDateInPHT(scheduleDate),
						month,
						day,
						weekday,
						fullDate,
						time,
					};
				})
		: [];

	return (
		<div className="min-h-screen bg-white">
			<HeroSection
				approvedOrdinances={approvedOrdinances}
				approvedResolutions={approvedResolutions}
			/>
			<QuickActions />
			<AboutSection councilorCount={12} />
			<RecentUpdates documents={latestDocuments} sessions={upcomingSessions} />
		</div>
	);
}
