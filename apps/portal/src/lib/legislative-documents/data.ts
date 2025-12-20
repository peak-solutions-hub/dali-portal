/**
 * Server-side data fetching functions for Legislative Documents
 * These functions are used in Server Components for SSR
 */

import type {
	DocumentFilters,
	LegislativeDocumentsResponse,
	LegislativeDocumentWithDetails,
} from "types/legislative-documents.types";
import { ITEMS_PER_PAGE } from "./constants";

// TODO: Replace with actual Supabase queries
const MOCK_DOCUMENTS: LegislativeDocumentWithDetails[] = [
	{
		id: 1,
		document_id: "1",
		official_number: "ORD-2024-001",
		series_year: 2024,
		type: "proposed_ordinance",
		date_enacted: "2024-12-15",
		created_at: "2024-12-01T00:00:00Z",
		author_names: ["Councilor Jane Doe", "Councilor John Smith"],
		sponsor_names: ["Mayor Office"],
		document: {
			id: "1",
			code_number: "DOC-001",
			title: "An Ordinance Establishing Smoke-Free Zones in All Public Markets",
			type: "proposed_ordinance",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-12-01T00:00:00Z",
		},
		displayTitle:
			"An Ordinance Establishing Smoke-Free Zones in All Public Markets",
		displayType: "Proposed Ordinance",
		displayClassification: "Health and Sanitation",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 2,
		document_id: "2",
		official_number: "RES-2024-045",
		series_year: 2024,
		type: "proposed_resolution",
		date_enacted: "2024-12-10",
		created_at: "2024-11-28T00:00:00Z",
		author_names: ["Councilor Bob Johnson"],
		document: {
			id: "2",
			code_number: "DOC-002",
			title:
				"Resolution Approving the Annual Budget for Infrastructure Development",
			type: "proposed_resolution",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-11-28T00:00:00Z",
		},
		displayTitle:
			"Resolution Approving the Annual Budget for Infrastructure Development",
		displayType: "Proposed Resolution",
		displayClassification: "Budget and Finance",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	// Add more mock documents (total of 25 for pagination testing)
	...Array.from(
		{ length: 23 },
		(_, i) =>
			({
				id: i + 3,
				document_id: `${i + 3}`,
				official_number: `ORD-2024-${String(i + 2).padStart(3, "0")}`,
				series_year: 2024 - Math.floor(i / 5),
				type: i % 2 === 0 ? "proposed_ordinance" : "proposed_resolution",
				date_enacted: `2024-${String(12 - Math.floor(i / 2)).padStart(
					2,
					"0",
				)}-${String((i % 28) + 1).padStart(2, "0")}`,
				created_at: `2024-${String(12 - Math.floor(i / 2)).padStart(
					2,
					"0",
				)}-01T00:00:00Z`,
				author_names: [`Councilor ${i % 2 === 0 ? "Jane" : "John"} ${i + 1}`],
				document: {
					id: `${i + 3}`,
					code_number: `DOC-${String(i + 3).padStart(3, "0")}`,
					title: `Document Title ${i + 3}`,
					type: i % 2 === 0 ? "proposed_ordinance" : "proposed_resolution",
					purpose: "for_agenda",
					source: "vice_mayors_office",
					status: "approved",
					classification: "legislative_docs",
					received_at: `2024-${String(12 - Math.floor(i / 2)).padStart(
						2,
						"0",
					)}-01T00:00:00Z`,
				},
				displayTitle: `Document Title ${i + 3}`,
				displayType: i % 2 === 0 ? "Proposed Ordinance" : "Proposed Resolution",
				displayClassification: [
					"Agriculture and Food",
					"Education",
					"Health",
					"Finance",
				][i % 4],
				pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
				pdfFilename: "arc42-DALI_Portal.pdf",
			}) as LegislativeDocumentWithDetails,
	),
];

/**
 * Fetch legislative documents with filters and pagination
 * Server-side function for SSR
 */
export async function fetchLegislativeDocuments(
	filters: DocumentFilters = {},
): Promise<LegislativeDocumentsResponse> {
	// TODO: Replace with actual Supabase query
	// Example:
	// const { data, error } = await supabase
	//   .from('legislative_document')
	//   .select('*, document(*)')
	//   .filter(...)
	//   .range(start, end);

	// satisfy linter for async function
	await Promise.resolve();

	const {
		searchTerm = "",
		type = "all",
		year = "all",
		classification = "all",
		page = 1,
		limit = ITEMS_PER_PAGE,
	} = filters;

	// Apply filters to mock data
	let filteredDocuments = MOCK_DOCUMENTS;

	// Filter by search term
	if (searchTerm) {
		const lowerSearch = searchTerm.toLowerCase();
		filteredDocuments = filteredDocuments.filter(
			(doc) =>
				doc.official_number.toLowerCase().includes(lowerSearch) ||
				doc.displayTitle?.toLowerCase().includes(lowerSearch) ||
				doc.document?.title.toLowerCase().includes(lowerSearch),
		);
	}

	// Filter by type
	if (type !== "all") {
		filteredDocuments = filteredDocuments.filter((doc) => doc.type === type);
	}

	// Filter by year
	if (year !== "all") {
		filteredDocuments = filteredDocuments.filter(
			(doc) => doc.series_year === Number(year),
		);
	}

	// Filter by classification
	if (classification !== "all") {
		filteredDocuments = filteredDocuments.filter(
			(doc) => doc.displayClassification === classification,
		);
	}

	// Pagination
	const totalItems = filteredDocuments.length;
	const totalPages = Math.ceil(totalItems / limit);
	const currentPage = Math.max(1, Math.min(page, totalPages));
	const startIndex = (currentPage - 1) * limit;
	const endIndex = startIndex + limit;
	const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

	return {
		documents: paginatedDocuments,
		pagination: {
			currentPage,
			totalPages,
			totalItems,
			itemsPerPage: limit,
			hasNextPage: currentPage < totalPages,
			hasPreviousPage: currentPage > 1,
		},
	};
}

/**
 * Fetch a single legislative document by ID
 * Server-side function for SSR
 */
export async function fetchLegislativeDocument(
	id: string,
): Promise<LegislativeDocumentWithDetails | null> {
	// TODO: Replace with actual Supabase query
	// Example:
	// const { data, error } = await supabase
	//   .from('legislative_document')
	//   .select('*, document(*)')
	//   .eq('id', id)
	//   .single();

	// satisfy linter for async function
	await Promise.resolve();

	const document = MOCK_DOCUMENTS.find((doc) => doc.id === Number(id));
	return document || null;
}

/**
 * Get all available years from documents
 * Server-side function for SSR
 */
export async function fetchAvailableYears(): Promise<number[]> {
	// TODO: Replace with actual Supabase query
	// Example:
	// const { data } = await supabase
	//   .from('legislative_document')
	//   .select('series_year')
	//   .order('series_year', { ascending: false });

	// satisfy linter for async function
	await Promise.resolve();

	const years = MOCK_DOCUMENTS.map((doc) => doc.series_year).filter(
		(year): year is number => typeof year === "number",
	);

	return Array.from(new Set(years)).sort((a, b) => b - a);
}
