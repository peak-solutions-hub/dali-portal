import {
	CouncilMembersList,
	PageDescription,
	ViceMayor,
} from "@/components/council-members";

export default function CouncilMembers() {
	const viceMayorData = {
		name: "Hon. Lady Julie Grace (Love-Love) Baronda",
		position: "Vice Mayor / Presiding Officer",
		email: "vmbaronda.iloilocity@gmail.com",
		phone: "(033) 332-433",
		imageUrl: "/vm-love.png",
	};

	const councilMembers = [
		{
			id: "1",
			name: "Hon. Lyndon Acap",
			position: "City Councilor",
			email: "councilor1@iloilocity.gov.ph",
			phone: "(033) 337-1234",
			imageUrl: "/Councilors/hon-acap.png",
			chairmanships: [
				"Veterans, Retirees, Elderly and Disabled Person",
				"Games, Amusement and Professional Sports",
			],
		},
		{
			id: "2",
			name: "Hon. Sedrey Cabaluna",
			position: "City Councilor",
			email: "councilor2@iloilocity.gov.ph",
			phone: "(033) 337-1235",
			imageUrl: "/Councilors/hon-cabaluna.png",
			chairmanships: [
				"Police, Fire, Penology, Public Safety, Order & Security, Dangerous Drugs and Rehabilitation",
				"Transportation",
				"Communication and Public Information",
			],
		},
		{
			id: "3",
			name: "Hon. Romel Duron",
			position: "City Councilor",
			email: "councilor3@iloilocity.gov.ph",
			phone: "(033) 337-1236",
			imageUrl: "/Councilors/hon-duron.png",
			chairmanships: [
				"Energy and Public Utilities",
				"Public Services, Environmental Protection and Ecology",
			],
		},
		{
			id: "4",
			name: "Hon. Rudolph Roding Ganzon",
			position: "City Councilor",
			email: "councilor4@iloilocity.gov.ph",
			phone: "(033) 337-1237",
			imageUrl: "/Councilors/hon-ganzon.png",
			chairmanships: [
				"Trade, Commerce and Industry",
				"Domestic and International Relations",
				"Education, Science and Technology",
			],
		},
		{
			id: "5",
			name: "Hon. Nene Dela Llana",
			position: "City Councilor",
			email: "councilor5@iloilocity.gov.ph",
			phone: "(033) 337-1238",
			imageUrl: "/Councilors/hon-delallana.png",
			chairmanships: [
				"Information Technology and Computerization",
				"Social Services",
			],
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
			chairmanships: [
				"Markets & Slaughterhouse",
				"Urban Poor, Human Rights and Minority Groups",
				"Moral Recovery",
			],
		},
		{
			id: "8",
			name: "Hon. Frances Grace Parcon",
			position: "City Councilor",
			email: "councilor8@iloilocity.gov.ph",
			phone: "(033) 337-1241",
			imageUrl: "/Councilors/hon-parcon.png",
			chairmanships: [
				"Agriculture, Fisheries, Aquatic and Natural Resources",
				"Women and Family Relations",
			],
		},
		{
			id: "9",
			name: "Hon. Rex Marcus Sarabia",
			position: "City Councilor",
			email: "councilor9@iloilocity.gov.ph",
			phone: "(033) 337-1242",
			imageUrl: "/Councilors/hon-sarabia.png",
			chairmanships: [
				"Rules, Ordinances, Resolutions, and Style; Justice and Legal Affairs",
				"Good Government and Public Accountability (Blue Ribbon Committee)",
				"Appropriations",
			],
		},
		{
			id: "10",
			name: "Hon. Miguel Treñas",
			position: "City Councilor",
			email: "councilor10@iloilocity.gov.ph",
			phone: "(033) 337-1243",
			imageUrl: "/Councilors/hon-trenas.png",
			chairmanships: [
				"Tourism, Culture and Historical Affairs",
				"Urban Planning, Housing and Land Development, Zoning, Expropriation, Assessment and Land Acquisition",
				"Local Accreditation",
			],
		},
		{
			id: "11",
			name: "Hon. Johnny Young",
			position: "City Councilor",
			email: "councilor11@iloilocity.gov.ph",
			phone: "(033) 337-1244",
			imageUrl: "/Councilors/hon-young.png",
			chairmanships: [
				"Engineering, Construction and Public Works",
				"Disaster Relief/Disaster Management",
				"Animal Welfare",
			],
		},
		{
			id: "12",
			name: "Hon. Alan Zaldivar",
			position: "City Councilor",
			email: "councilor12@iloilocity.gov.ph",
			phone: "(033) 337-1245",
			imageUrl: "/Councilors/hon-zaldivar.png",
			chairmanships: [
				"Health, Sanitation, and Hospital Services",
				"Cooperatives and Livelihood",
				"Labor, Employment, Manpower Development and Placement",
			],
		},
		{
			id: "13",
			name: "Hon. Jelma Crystel Implica",
			position: "President of the Sangguniang Kabataan (SK) Federation",
			email: "councilor12@iloilocity.gov.ph",
			phone: "(033) 337-1245",
			imageUrl: "/Councilors/hon-implica.png",
			chairmanships: ["Youth and Sports Development"],
		},
		{
			id: "14",
			name: "Hon. Ma. Irene Ong",
			position: "Iloilo City - Liga ng mga Barangay President",
			email: "councilor12@iloilocity.gov.ph",
			phone: "(033) 337-1245",
			imageUrl: "/Councilors/hon-ong.png",
			chairmanships: [
				"Ways and Means",
				"Barangay Affairs and Community Development",
			],
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
