import {
	AboutSection,
	HeroSection,
	QuickActions,
	RecentUpdates,
} from "@/components/home";

export default function HomePage() {
	// TODO: Replace with actual data
	const approvedOrdinances = 37;
	const approvedResolutions = 9;

	// TODO: Replace with actual data
	const councilorCount = 12;

	// TODO: Replace with actual data
	const latestDocuments = [
		{
			id: "1",
			number: "Ordinance No. 2024-123",
			title: "Annual Investment Plan 2025",
			type: "Ordinance" as const,
		},
		{
			id: "2",
			number: "Resolution No. 2024-456",
			title: "Commendation to Outstanding Teachers",
			type: "Resolution" as const,
		},
		{
			id: "3",
			number: "Ordinance No. 2024-122",
			title: "Tax Relief for Small Businesses",
			type: "Ordinance" as const,
		},
		{
			id: "4",
			number: "Resolution No. 2024-455",
			title: "Support for Local Farmers",
			type: "Resolution" as const,
		},
		{
			id: "5",
			number: "Ordinance No. 2024-121",
			title: "Environmental Protection Ordinance",
			type: "Ordinance" as const,
		},
	];

	// TODO: Replace with actual data
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
			<AboutSection councilorCount={councilorCount} />
			<RecentUpdates documents={latestDocuments} sessions={upcomingSessions} />
		</div>
	);
}
