import {
	CouncilMembersList,
	PageDescription,
	ViceMayor,
} from "@/components/council-members";

export default function CouncilMembers() {
	// TODO: Replace with actual data from Supabase
	const viceMayorData = {
		name: "Hon. Lady Julie Grace (Love-Love) Baronda",
		position: "Vice Mayor / Presiding Officer",
		email: "vmbaronda.iloilocity@gmail.com",
		phone: "(033) 332-433",
		imageUrl: "/vm-love.png",
	};

	// TODO: Replace with actual data from Supabase
	const councilMembers = [
		{
			id: "1",
			name: "Hon. Lyndon Acap",
			position: "City Councilor",
			email: "councilor1@iloilocity.gov.ph",
			phone: "(033) 337-1234",
			imageUrl: "/Councilors/hon-acap.png",
		},
		{
			id: "2",
			name: "Hon. Sedrey Cabaluna",
			position: "City Councilor",
			email: "councilor2@iloilocity.gov.ph",
			phone: "(033) 337-1235",
			imageUrl: "/Councilors/hon-cabaluna.png",
		},
		{
			id: "3",
			name: "Hon. Romel Duron",
			position: "City Councilor",
			email: "councilor3@iloilocity.gov.ph",
			phone: "(033) 337-1236",
			imageUrl: "/Councilors/hon-duron.png",
		},
		{
			id: "4",
			name: "Hon. Rudolph Roding Ganzon",
			position: "City Councilor",
			email: "councilor4@iloilocity.gov.ph",
			phone: "(033) 337-1237",
			imageUrl: "/Councilors/hon-ganzon.png",
		},
		{
			id: "5",
			name: "Hon. Nene Dela Llana",
			position: "City Councilor",
			email: "councilor5@iloilocity.gov.ph",
			phone: "(033) 337-1238",
			imageUrl: "/Councilors/hon-delallana.png",
		},
		{
			id: "6",
			name: "Hon. Sheen Mabilog",
			position: "City Councilor",
			email: "councilor6@iloilocity.gov.ph",
			phone: "(033) 337-1239",
			imageUrl: "/Councilors/hon-mabilog.png",
		},
		{
			id: "7",
			name: "Hon. Mandrie Malabor",
			position: "City Councilor",
			email: "councilor7@iloilocity.gov.ph",
			phone: "(033) 337-1240",
			imageUrl: "/Councilors/hon-malabor.png",
		},
		{
			id: "8",
			name: "Hon. Frances Grace Parcon",
			position: "City Councilor",
			email: "councilor8@iloilocity.gov.ph",
			phone: "(033) 337-1241",
			imageUrl: "/Councilors/hon-parcon.png",
		},
		{
			id: "9",
			name: "Hon. Rex Marcus Sarabia",
			position: "City Councilor",
			email: "councilor9@iloilocity.gov.ph",
			phone: "(033) 337-1242",
			imageUrl: "/Councilors/hon-sarabia.png",
		},
		{
			id: "10",
			name: "Hon. Miguel Treñas",
			position: "City Councilor",
			email: "councilor10@iloilocity.gov.ph",
			phone: "(033) 337-1243",
			imageUrl: "/Councilors/hon-trenas.png",
		},
		{
			id: "11",
			name: "Hon. Johnny Young",
			position: "City Councilor",
			email: "councilor11@iloilocity.gov.ph",
			phone: "(033) 337-1244",
			imageUrl: "/Councilors/hon-young.png",
		},
		{
			id: "12",
			name: "Hon. Alan Zaldivar",
			position: "City Councilor",
			email: "councilor12@iloilocity.gov.ph",
			phone: "(033) 337-1245",
			imageUrl: "/Councilors/hon-zaldivar.png",
		},
	];

	return (
		<div className="min-h-screen">
			<PageDescription />
			<ViceMayor {...viceMayorData} />
			<CouncilMembersList members={councilMembers} />
		</div>
	);
}
