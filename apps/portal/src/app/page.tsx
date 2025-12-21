import { HeroSection } from "@/components/home/hero-section";

export default function HomePage() {
	// TODO: Replace with actual data from Supabase
	const approvedOrdinances = 37;
	const approvedResolutions = 9;

	return (
		<div>
			<HeroSection
				approvedOrdinances={approvedOrdinances}
				approvedResolutions={approvedResolutions}
			/>
		</div>
	);
}
