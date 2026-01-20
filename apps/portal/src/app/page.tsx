import { isDefinedError } from "@orpc/client";
import {
	formatSessionDate,
	transformDocumentListDates,
	transformSessionListDates,
} from "@repo/shared";
import { HeroSection, QuickActions, RecentUpdates } from "@/components/home";
import { api } from "@/lib/api.client";

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

	if (latestDocsError && isDefinedError(latestDocsError)) {
		console.error("Failed to fetch latest documents:", latestDocsError.message);
	}

	// Transform documents and map to the format expected by RecentUpdates
	const latestDocuments = latestDocsResponse?.documents
		? transformDocumentListDates(latestDocsResponse.documents).map((doc) => ({
				id: String(doc.id),
				number: doc.officialNumber,
				title: doc.displayTitle || doc.document.title,
				type:
					doc.type === "ordinance"
						? ("Ordinance" as const)
						: ("Resolution" as const),
			}))
		: [];

	// Fetch upcoming sessions (next 3)
	const [sessionsError, sessionsResponse] = await api.sessions.list({
		dateFrom: new Date(),
		sortBy: "date",
		sortDirection: "asc",
		limit: 3,
		page: 1,
	});
	console.log(sessionsResponse);
	if (sessionsError && isDefinedError(sessionsError)) {
		console.error("Failed to fetch upcoming sessions:", sessionsError.message);
	}

	const upcomingSessions = sessionsResponse?.sessions
		? transformSessionListDates(sessionsResponse.sessions)
				.slice(0, 3)
				.map((s) => {
					const scheduleDate = new Date(s.scheduleDate);
					const month = scheduleDate.toLocaleString("en-US", {
						month: "short",
					});
					const day = String(scheduleDate.getDate()).padStart(2, "0");
					const weekday = scheduleDate.toLocaleString("en-US", {
						weekday: "long",
					});
					const fullDate = formatSessionDate(scheduleDate);

					return {
						id: s.id,
						type: s.type,
						sessionNumber: String(s.sessionNumber),
						date: String(scheduleDate.toISOString().split("T")[0]),
						month,
						day,
						weekday,
						fullDate,
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
			<RecentUpdates documents={latestDocuments} sessions={upcomingSessions} />
		</div>
	);
}
