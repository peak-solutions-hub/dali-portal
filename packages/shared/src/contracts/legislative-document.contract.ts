import { oc } from "@orpc/contract";
import {
	GetLatestLegislativeDocumentSchema,
	GetLegislativeDocumentByIdSchema,
	GetLegislativeDocumentListSchema,
	LegislativeDocumentListResponseSchema,
	LegislativeDocumentStatisticsSchema,
	LegislativeDocumentWithDetailsSchema,
} from "../schemas/legislative-document.schema";

export const listLegislativeDocuments = oc
	.route({
		method: "GET",
		path: "/legislative-documents",
		summary: "List legislative documents",
		description:
			"Public endpoint to search and browse legislative documents with filtering and pagination.",
		tags: ["Legislative Documents", "Public"],
	})
	.input(GetLegislativeDocumentListSchema)
	.output(LegislativeDocumentListResponseSchema);

export const getLegislativeDocumentById = oc
	.route({
		method: "GET",
		path: "/legislative-documents/{id}",
		summary: "Get legislative document by ID",
		description:
			"Public endpoint to retrieve detailed information about a specific legislative document.",
		tags: ["Legislative Documents", "Public"],
	})
	.errors({
		NOT_FOUND: {
			status: 404,
			description: "Legislative document not found",
		},
	})
	.input(GetLegislativeDocumentByIdSchema)
	.output(LegislativeDocumentWithDetailsSchema);

export const getLegislativeDocumentStatistics = oc
	.route({
		method: "GET",
		path: "/legislative-documents/statistics",
		summary: "Get legislative document statistics",
		description:
			"Public endpoint to retrieve statistics about legislative documents (total ordinances and resolutions).",
		tags: ["Legislative Documents", "Public"],
	})
	.errors({
		INTERNAL_SERVER_ERROR: {
			status: 500,
			description: "Failed to fetch statistics",
		},
	})
	// no input
	.output(LegislativeDocumentStatisticsSchema);

export const getLatestLegislativeDocuments = oc
	.route({
		method: "GET",
		path: "/legislative-documents/latest",
		summary: "Get latest legislative documents",
		description:
			"Public endpoint to retrieve the latest ordinances and resolutions for the home page.",
		tags: ["Legislative Documents", "Public"],
	})
	.errors({
		INTERNAL_SERVER_ERROR: {
			status: 500,
			description: "Failed to fetch latest documents",
		},
	})
	.input(GetLatestLegislativeDocumentSchema)
	.output(LegislativeDocumentListResponseSchema);

export const legislativeDocumentContract = {
	// Public endpoints
	list: listLegislativeDocuments,
	statistics: getLegislativeDocumentStatistics,
	latest: getLatestLegislativeDocuments,
	getById: getLegislativeDocumentById,

	// Admin endpoints (auth required - not implemented yet)
	// create: createLegislativeDocument,
	// update: updateLegislativeDocument,
};
