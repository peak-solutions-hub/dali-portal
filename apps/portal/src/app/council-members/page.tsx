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
			email: "acaplyndonoffice@gmail.com",
			phone: "(033) 320-7512",
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
			email: "vreylan24@gmail.com",
			phone: "(033) 337-2722",
			imageUrl: "/Councilors/hon-cabaluna.png",
			chairmanships: [
				"Police, Fire, Penology, Public Safety, Order & Security, Dangerous Drugs and Rehabilitation",
				"Transportation",
				"Communication and Public Information",
			],
		},
		{
			id: "3",
			name: "Hon. Nene Dela Llana",
			position: "City Councilor",
			email: "nenedalallanaofis@gmail.com",
			phone: "(033) 320-7582",
			imageUrl: "/Councilors/hon-delallana.png",
			chairmanships: [
				"Information Technology and Computerization",
				"Social Services",
			],
		},
		{
			id: "4",
			name: "Hon. Romel Duron",
			position: "City Councilor",
			email: "conncilorduron@yahoo.com",
			phone: "(033) 337-3219",
			imageUrl: "/Councilors/hon-duron.png",
			chairmanships: [
				"Energy and Public Utilities",
				"Public Services, Environmental Protection and Ecology",
			],
		},
		{
			id: "5",
			name: "Hon. Rudolph Roding Ganzon",
			position: "City Councilor",
			email: "rjog.staff@gmail.com",
			phone: "(033) 337-5212",
			imageUrl: "/Councilors/hon-ganzon.png",
			chairmanships: [
				"Trade, Commerce and Industry",
				"Domestic and International Relations",
				"Education, Science and Technology",
			],
		},
		{
			id: "6",
			name: "Hon. Sheen Mabilog",
			position: "City Councilor",
			email: "sheenmabilog.gov@gmail.com",
			phone: "(033) 320-5985",
			imageUrl: "/Councilors/hon-mabilog.png",
		},
		{
			id: "7",
			name: "Hon. Mandrie Malabor",
			position: "City Councilor",
			email: "councilormalabor@gmail.com",
			phone: "(033) 332-4348",
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
			email: "armandparcon_office@yahoo.com",
			phone: "(033) 336-0699",
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
			email: "councilorattyrexsarabia@gmail.com",
			phone: "(033) 337-4290",
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
			email: "tjosemariamiguel@gmail.com",
			phone: "(033) 320-8364",
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
			email: "johnnyyoung2022@gmail.com",
			phone: "(033) 337-4147",
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
			email: "councilorzaldivar@gmail.com",
			phone: "(033) 332-4479",
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
			email: "skfederationiloilo@gmail.com",
			phone: "(033) 332-4353",
			imageUrl: "/Councilors/hon-implica.png",
			chairmanships: ["Youth and Sports Development"],
		},
		{
			id: "14",
			name: "Hon. Ma. Irene Ong",
			position: "Iloilo City - Liga ng mga Barangay President",
			email: "lnbiiloilocityph@gmail.com",
			phone: "(033) 333-1111 Local 895",
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
