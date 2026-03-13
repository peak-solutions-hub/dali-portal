import { oc } from "@orpc/contract";
import { ERRORS } from "../constants";
import {
	GetLatestLegislativeDocumentSchema,
	GetLegislativeDocumentByIdSchema,
	GetLegislativeDocumentListSchema,
	LegislativeDocumentListResponseSchema,
	LegislativeDocumentStatisticsSchema,
	LegislativeDocumentWithDetailsSchema,
	PublishLegislativeDocumentResponseSchema,
	PublishLegislativeDocumentSchema,
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
		NOT_FOUND: ERRORS.GENERAL.NOT_FOUND,
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
		INTERNAL_SERVER_ERROR: ERRORS.GENERAL.INTERNAL_SERVER_ERROR,
	})
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
		INTERNAL_SERVER_ERROR: ERRORS.GENERAL.INTERNAL_SERVER_ERROR,
	})
	.input(GetLatestLegislativeDocumentSchema)
	.output(LegislativeDocumentListResponseSchema);

export const publishLegislativeDocument = oc
	.route({
		method: "POST",
		path: "/admin/legislative-documents/publish",
		summary: "Publish a calendared legislative document",
		description:
			"Admin endpoint to publish a calendared legislative document to archive and mark document status as PUBLISHED.",
		tags: ["Legislative Documents", "Admin"],
	})
	.errors({
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
		CONFLICT: ERRORS.GENERAL.CONFLICT,
		NOT_FOUND: ERRORS.DOCUMENT.NOT_FOUND,
		FORBIDDEN: ERRORS.GENERAL.FORBIDDEN,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
	})
	.input(PublishLegislativeDocumentSchema)
	.output(PublishLegislativeDocumentResponseSchema);

export const legislativeDocumentContract = {
	// Public endpoints
	list: listLegislativeDocuments,
	statistics: getLegislativeDocumentStatistics,
	latest: getLatestLegislativeDocuments,
	getById: getLegislativeDocumentById,
	publish: publishLegislativeDocument,

	// Admin endpoints (auth required - not implemented yet)
	// create: createLegislativeDocument,
	// update: updateLegislativeDocument,
};
