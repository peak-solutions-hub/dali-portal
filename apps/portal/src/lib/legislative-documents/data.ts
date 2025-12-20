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
		author_names: ["Councilor Maria Santos"],
		sponsor_names: ["Vice Mayor Office"],
		document: {
			id: "1",
			code_number: "DOC-001",
			title:
				"An Ordinance Appropriating Funds for City Infrastructure Projects",
			type: "proposed_ordinance",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-12-01T00:00:00Z",
		},
		displayTitle:
			"An Ordinance Appropriating Funds for City Infrastructure Projects",
		displayType: "Proposed Ordinance",
		displayClassification: "Appropriation",
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
		author_names: ["Councilor Juan Dela Cruz"],
		document: {
			id: "2",
			code_number: "DOC-002",
			title: "Resolution Supporting Barangay Development Programs",
			type: "proposed_resolution",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-11-28T00:00:00Z",
		},
		displayTitle: "Resolution Supporting Barangay Development Programs",
		displayType: "Proposed Resolution",
		displayClassification: "Barangay Affairs",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 3,
		document_id: "3",
		official_number: "ORD-2024-002",
		series_year: 2024,
		type: "proposed_ordinance",
		date_enacted: "2024-11-25",
		created_at: "2024-11-15T00:00:00Z",
		author_names: ["Councilor Elena Rodriguez"],
		document: {
			id: "3",
			code_number: "DOC-003",
			title:
				"An Ordinance Amending the City Charter Provisions on Local Governance",
			type: "proposed_ordinance",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-11-15T00:00:00Z",
		},
		displayTitle:
			"An Ordinance Amending the City Charter Provisions on Local Governance",
		displayType: "Proposed Ordinance",
		displayClassification: "Charter Amendment",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 4,
		document_id: "4",
		official_number: "RES-2024-046",
		series_year: 2024,
		type: "proposed_resolution",
		date_enacted: "2024-11-20",
		created_at: "2024-11-10T00:00:00Z",
		author_names: ["Councilor Roberto Garcia"],
		document: {
			id: "4",
			code_number: "DOC-004",
			title: "Resolution Implementing New Civil Service Hiring Guidelines",
			type: "proposed_resolution",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-11-10T00:00:00Z",
		},
		displayTitle: "Resolution Implementing New Civil Service Hiring Guidelines",
		displayType: "Proposed Resolution",
		displayClassification: "Civil Service",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 5,
		document_id: "5",
		official_number: "RES-2024-047",
		series_year: 2024,
		type: "proposed_resolution",
		date_enacted: "2024-11-15",
		created_at: "2024-11-05T00:00:00Z",
		author_names: ["Councilor Carmen Lopez"],
		document: {
			id: "5",
			code_number: "DOC-005",
			title: "Resolution Commending Outstanding Barangay Health Workers",
			type: "proposed_resolution",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-11-05T00:00:00Z",
		},
		displayTitle: "Resolution Commending Outstanding Barangay Health Workers",
		displayType: "Proposed Resolution",
		displayClassification: "Commendation",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 6,
		document_id: "6",
		official_number: "RES-2024-048",
		series_year: 2024,
		type: "committee_report",
		date_enacted: "2024-11-10",
		created_at: "2024-11-01T00:00:00Z",
		author_names: ["Councilor Diego Reyes"],
		document: {
			id: "6",
			code_number: "DOC-006",
			title: "Committee Investigation Report on Traffic Management Issues",
			type: "committee_report",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-11-01T00:00:00Z",
		},
		displayTitle: "Committee Investigation Report on Traffic Management Issues",
		displayType: "Committee Report",
		displayClassification: "Committee Investigation",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 7,
		document_id: "7",
		official_number: "REP-2024-001",
		series_year: 2024,
		type: "committee_report",
		date_enacted: "2024-10-30",
		created_at: "2024-10-20T00:00:00Z",
		author_names: ["Councilor Sofia Martinez"],
		document: {
			id: "7",
			code_number: "DOC-007",
			title: "Committee Report on Public Market Modernization",
			type: "committee_report",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-10-20T00:00:00Z",
		},
		displayTitle: "Committee Report on Public Market Modernization",
		displayType: "Committee Report",
		displayClassification: "Committee Report",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 8,
		document_id: "8",
		official_number: "ORD-2024-003",
		series_year: 2024,
		type: "proposed_ordinance",
		date_enacted: "2024-10-25",
		created_at: "2024-10-15T00:00:00Z",
		author_names: ["Councilor Antonio Cruz"],
		document: {
			id: "8",
			code_number: "DOC-008",
			title: "An Ordinance Promoting Cultural Heritage Preservation",
			type: "proposed_ordinance",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-10-15T00:00:00Z",
		},
		displayTitle: "An Ordinance Promoting Cultural Heritage Preservation",
		displayType: "Proposed Ordinance",
		displayClassification: "Cultural Development",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 9,
		document_id: "9",
		official_number: "RES-2024-049",
		series_year: 2024,
		type: "proposed_resolution",
		date_enacted: "2024-10-20",
		created_at: "2024-10-10T00:00:00Z",
		author_names: ["Councilor Isabel Ramos"],
		document: {
			id: "9",
			code_number: "DOC-009",
			title: "Resolution Declaring Climate Emergency in the City",
			type: "proposed_resolution",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-10-10T00:00:00Z",
		},
		displayTitle: "Resolution Declaring Climate Emergency in the City",
		displayType: "Proposed Resolution",
		displayClassification: "Declaration",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 10,
		document_id: "10",
		official_number: "ORD-2024-004",
		series_year: 2024,
		type: "proposed_ordinance",
		date_enacted: "2024-10-15",
		created_at: "2024-10-05T00:00:00Z",
		author_names: ["Councilor Fernando Santos"],
		document: {
			id: "10",
			code_number: "DOC-010",
			title: "An Ordinance Supporting Small and Medium Enterprise Development",
			type: "proposed_ordinance",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-10-05T00:00:00Z",
		},
		displayTitle:
			"An Ordinance Supporting Small and Medium Enterprise Development",
		displayType: "Proposed Ordinance",
		displayClassification: "Economic Development",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 11,
		document_id: "11",
		official_number: "RES-2024-050",
		series_year: 2024,
		type: "proposed_resolution",
		date_enacted: "2024-10-10",
		created_at: "2024-09-30T00:00:00Z",
		author_names: ["Councilor Beatriz Fernandez"],
		document: {
			id: "11",
			code_number: "DOC-011",
			title: "Resolution Improving Public School Facilities",
			type: "proposed_resolution",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-09-30T00:00:00Z",
		},
		displayTitle: "Resolution Improving Public School Facilities",
		displayType: "Proposed Resolution",
		displayClassification: "Education",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 12,
		document_id: "12",
		official_number: "ORD-2024-005",
		series_year: 2024,
		type: "proposed_ordinance",
		date_enacted: "2024-10-05",
		created_at: "2024-09-25T00:00:00Z",
		author_names: ["Councilor Luis Mendoza"],
		document: {
			id: "12",
			code_number: "DOC-012",
			title: "An Ordinance on Solid Waste Management and Recycling",
			type: "proposed_ordinance",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-09-25T00:00:00Z",
		},
		displayTitle: "An Ordinance on Solid Waste Management and Recycling",
		displayType: "Proposed Ordinance",
		displayClassification: "Environment",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 13,
		document_id: "13",
		official_number: "RES-2024-051",
		series_year: 2024,
		type: "proposed_resolution",
		date_enacted: "2024-09-30",
		created_at: "2024-09-20T00:00:00Z",
		author_names: ["Councilor Patricia Gomez"],
		document: {
			id: "13",
			code_number: "DOC-013",
			title: "Resolution Strengthening Anti-Corruption Measures",
			type: "proposed_resolution",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-09-20T00:00:00Z",
		},
		displayTitle: "Resolution Strengthening Anti-Corruption Measures",
		displayType: "Proposed Resolution",
		displayClassification: "Good Governance",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 14,
		document_id: "14",
		official_number: "ORD-2024-006",
		series_year: 2024,
		type: "proposed_ordinance",
		date_enacted: "2024-09-25",
		created_at: "2024-09-15T00:00:00Z",
		author_names: ["Councilor Miguel Torres"],
		document: {
			id: "14",
			code_number: "DOC-014",
			title: "An Ordinance Establishing Smoke-Free Zones in All Public Markets",
			type: "proposed_ordinance",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-09-15T00:00:00Z",
		},
		displayTitle:
			"An Ordinance Establishing Smoke-Free Zones in All Public Markets",
		displayType: "Proposed Ordinance",
		displayClassification: "Health & Sanitation",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 15,
		document_id: "15",
		official_number: "RES-2024-052",
		series_year: 2024,
		type: "proposed_resolution",
		date_enacted: "2024-09-20",
		created_at: "2024-09-10T00:00:00Z",
		author_names: ["Councilor Gabriela Ramirez"],
		document: {
			id: "15",
			code_number: "DOC-015",
			title: "Resolution Approving Road Construction and Repair Projects",
			type: "proposed_resolution",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-09-10T00:00:00Z",
		},
		displayTitle: "Resolution Approving Road Construction and Repair Projects",
		displayType: "Proposed Resolution",
		displayClassification: "Infrastructure",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 16,
		document_id: "16",
		official_number: "ORD-2024-007",
		series_year: 2024,
		type: "proposed_ordinance",
		date_enacted: "2024-09-15",
		created_at: "2024-09-05T00:00:00Z",
		author_names: ["Councilor Ricardo Diaz"],
		document: {
			id: "16",
			code_number: "DOC-016",
			title: "An Ordinance on Employment Programs and Job Fairs",
			type: "proposed_ordinance",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-09-05T00:00:00Z",
		},
		displayTitle: "An Ordinance on Employment Programs and Job Fairs",
		displayType: "Proposed Ordinance",
		displayClassification: "Labor & Employment",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 17,
		document_id: "17",
		official_number: "RES-2024-053",
		series_year: 2024,
		type: "proposed_resolution",
		date_enacted: "2024-09-10",
		created_at: "2024-08-30T00:00:00Z",
		author_names: ["Councilor Amanda Silva"],
		document: {
			id: "17",
			code_number: "DOC-017",
			title: "Resolution Codifying Municipal Ordinances",
			type: "proposed_resolution",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-08-30T00:00:00Z",
		},
		displayTitle: "Resolution Codifying Municipal Ordinances",
		displayType: "Proposed Resolution",
		displayClassification: "Laws & Ordinances",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 18,
		document_id: "18",
		official_number: "ORD-2024-008",
		series_year: 2024,
		type: "proposed_ordinance",
		date_enacted: "2024-09-05",
		created_at: "2024-08-25T00:00:00Z",
		author_names: ["Councilor Victor Castillo"],
		document: {
			id: "18",
			code_number: "DOC-018",
			title: "An Ordinance Strengthening Peace and Order Programs",
			type: "proposed_ordinance",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-08-25T00:00:00Z",
		},
		displayTitle: "An Ordinance Strengthening Peace and Order Programs",
		displayType: "Proposed Ordinance",
		displayClassification: "Public Safety",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 19,
		document_id: "19",
		official_number: "RES-2024-054",
		series_year: 2024,
		type: "proposed_resolution",
		date_enacted: "2024-08-30",
		created_at: "2024-08-20T00:00:00Z",
		author_names: ["Councilor Monica Herrera"],
		document: {
			id: "19",
			code_number: "DOC-019",
			title: "Resolution on Public Building Maintenance and Repair",
			type: "proposed_resolution",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-08-20T00:00:00Z",
		},
		displayTitle: "Resolution on Public Building Maintenance and Repair",
		displayType: "Proposed Resolution",
		displayClassification: "Public Works",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 20,
		document_id: "20",
		official_number: "ORD-2024-009",
		series_year: 2024,
		type: "proposed_ordinance",
		date_enacted: "2024-08-25",
		created_at: "2024-08-15T00:00:00Z",
		author_names: ["Councilor Daniel Ortiz"],
		document: {
			id: "20",
			code_number: "DOC-020",
			title: "An Ordinance Expanding Social Welfare Programs",
			type: "proposed_ordinance",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-08-15T00:00:00Z",
		},
		displayTitle: "An Ordinance Expanding Social Welfare Programs",
		displayType: "Proposed Ordinance",
		displayClassification: "Social Services",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 21,
		document_id: "21",
		official_number: "RES-2024-055",
		series_year: 2024,
		type: "proposed_resolution",
		date_enacted: "2024-08-20",
		created_at: "2024-08-10T00:00:00Z",
		author_names: ["Councilor Cristina Navarro"],
		document: {
			id: "21",
			code_number: "DOC-021",
			title: "Resolution Supporting Local Tourism Initiatives",
			type: "proposed_resolution",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-08-10T00:00:00Z",
		},
		displayTitle: "Resolution Supporting Local Tourism Initiatives",
		displayType: "Proposed Resolution",
		displayClassification: "Tourism",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 22,
		document_id: "22",
		official_number: "ORD-2024-010",
		series_year: 2024,
		type: "proposed_ordinance",
		date_enacted: "2024-08-15",
		created_at: "2024-08-05T00:00:00Z",
		author_names: ["Councilor Ernesto Valdez"],
		document: {
			id: "22",
			code_number: "DOC-022",
			title: "An Ordinance on Public Transportation Management",
			type: "proposed_ordinance",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-08-05T00:00:00Z",
		},
		displayTitle: "An Ordinance on Public Transportation Management",
		displayType: "Proposed Ordinance",
		displayClassification: "Transportation",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 23,
		document_id: "23",
		official_number: "RES-2024-056",
		series_year: 2024,
		type: "proposed_resolution",
		date_enacted: "2024-08-10",
		created_at: "2024-07-30T00:00:00Z",
		author_names: ["Councilor Laura Perez"],
		document: {
			id: "23",
			code_number: "DOC-023",
			title: "Resolution Approving Comprehensive Land Use Plan",
			type: "proposed_resolution",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-07-30T00:00:00Z",
		},
		displayTitle: "Resolution Approving Comprehensive Land Use Plan",
		displayType: "Proposed Resolution",
		displayClassification: "Urban Planning",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 24,
		document_id: "24",
		official_number: "ORD-2024-011",
		series_year: 2024,
		type: "proposed_ordinance",
		date_enacted: "2024-08-05",
		created_at: "2024-07-25T00:00:00Z",
		author_names: ["Councilor Alberto Morales"],
		document: {
			id: "24",
			code_number: "DOC-024",
			title: "An Ordinance Revising Real Property Tax Regulations",
			type: "proposed_ordinance",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-07-25T00:00:00Z",
		},
		displayTitle: "An Ordinance Revising Real Property Tax Regulations",
		displayType: "Proposed Ordinance",
		displayClassification: "Ways and Means",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 25,
		document_id: "25",
		official_number: "RES-2024-057",
		series_year: 2024,
		type: "proposed_resolution",
		date_enacted: "2024-07-30",
		created_at: "2024-07-20T00:00:00Z",
		author_names: ["Councilor Veronica Castro"],
		document: {
			id: "25",
			code_number: "DOC-025",
			title: "Resolution on Women and Children Protection Programs",
			type: "proposed_resolution",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-07-20T00:00:00Z",
		},
		displayTitle: "Resolution on Women and Children Protection Programs",
		displayType: "Proposed Resolution",
		displayClassification: "Women & Children",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 26,
		document_id: "26",
		official_number: "ORD-2024-012",
		series_year: 2024,
		type: "proposed_ordinance",
		date_enacted: "2024-07-25",
		created_at: "2024-07-15T00:00:00Z",
		author_names: ["Councilor Jorge Aguilar"],
		document: {
			id: "26",
			code_number: "DOC-026",
			title: "An Ordinance Supporting Youth Sports and Recreation Programs",
			type: "proposed_ordinance",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2024-07-15T00:00:00Z",
		},
		displayTitle:
			"An Ordinance Supporting Youth Sports and Recreation Programs",
		displayType: "Proposed Ordinance",
		displayClassification: "Youth Development",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 27,
		document_id: "27",
		official_number: "ORD-2023-015",
		series_year: 2023,
		type: "proposed_ordinance",
		date_enacted: "2023-12-20",
		created_at: "2023-12-10T00:00:00Z",
		author_names: ["Councilor Sandra Velasco"],
		document: {
			id: "27",
			code_number: "DOC-027",
			title: "An Ordinance on School-Based Feeding Programs",
			type: "proposed_ordinance",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2023-12-10T00:00:00Z",
		},
		displayTitle: "An Ordinance on School-Based Feeding Programs",
		displayType: "Proposed Ordinance",
		displayClassification: "Education",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
	{
		id: 28,
		document_id: "28",
		official_number: "RES-2023-080",
		series_year: 2023,
		type: "proposed_resolution",
		date_enacted: "2023-12-15",
		created_at: "2023-12-05T00:00:00Z",
		author_names: ["Councilor Eduardo Rivera"],
		document: {
			id: "28",
			code_number: "DOC-028",
			title: "Resolution Enhancing Disaster Preparedness Measures",
			type: "proposed_resolution",
			purpose: "for_agenda",
			source: "vice_mayors_office",
			status: "approved",
			classification: "legislative_docs",
			received_at: "2023-12-05T00:00:00Z",
		},
		displayTitle: "Resolution Enhancing Disaster Preparedness Measures",
		displayType: "Proposed Resolution",
		displayClassification: "Public Safety",
		pdfUrl: "/mock-documents/arc42-DALI_Portal.pdf",
		pdfFilename: "arc42-DALI_Portal.pdf",
	},
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
