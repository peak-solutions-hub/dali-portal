import { HeroSection, QuickActions, RecentUpdates } from "@/components/home";

export default function HomePage() {
	// TODO: Replace with actual data
	const approvedOrdinances = 37;
	const approvedResolutions = 9;

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

	return (
		<div className="min-h-screen bg-white">
			<HeroSection
				approvedOrdinances={approvedOrdinances}
				approvedResolutions={approvedResolutions}
			/>
			<QuickActions />
			<RecentUpdates documents={latestDocuments} />
		</div>
	);
}
