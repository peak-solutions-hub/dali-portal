import { PageDescription, ViceMayor } from "@/components/council-members";

export default function CouncilMembersPage() {
	// TODO: Replace with actual data from Supabase
	const viceMayorData = {
		name: "Hon. Lady Julie Grace (Love-Love) Baronda ",
		position: "Vice Mayor / Presiding Officer",
		email: "vmbaronda.iloilocity@gmail.com",
		phone: "(033) 332-433",
		imageUrl: "/vm-love.png",
	};

	return (
		<div className="min-h-screen">
			<PageDescription />
			<ViceMayor {...viceMayorData} />
		</div>
	);
}
