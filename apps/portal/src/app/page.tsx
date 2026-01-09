import { isDefinedError } from "@orpc/client";
import { transformDocumentListDates } from "@repo/shared";
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

	// TODO: Replace with actual session data from API when sessions feature is implemented
	const upcomingSessions = [
		{
			id: "1",
			type: "Regular",
			sessionNumber: "45",
			date: "2026-12-23",
			month: "Dec",
			day: "23",
			weekday: "Monday",
			fullDate: "Monday, December 23, 2026",
		},
		{
			id: "2",
			type: "Special",
			sessionNumber: "46",
			date: "2026-12-27",
			month: "Dec",
			day: "27",
			weekday: "Friday",
			fullDate: "Friday, December 27, 2026",
		},
		{
			id: "3",
			type: "Regular",
			sessionNumber: "47",
			date: "2026-01-06",
			month: "Jan",
			day: "06",
			weekday: "Monday",
			fullDate: "Monday, January 6, 2026",
		},
	];

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
