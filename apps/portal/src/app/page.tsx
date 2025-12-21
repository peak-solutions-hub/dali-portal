import { HeroSection, QuickActions } from "@/components/home";

export default function HomePage() {
	// TODO: Replace with actual data from Supabase
	const approvedOrdinances = 37;
	const approvedResolutions = 9;

	return (
		<div className="min-h-screen bg-white">
			<HeroSection
				approvedOrdinances={approvedOrdinances}
				approvedResolutions={approvedResolutions}
			/>
			<QuickActions />
		</div>
	);
}
