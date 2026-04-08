import { oc } from "@orpc/contract";
import { ERRORS } from "../constants";
import {
	CreateDocumentResponseSchema,
	CreateDocumentSchema,
	CreateDocumentUploadUrlResponseSchema,
	CreateDocumentUploadUrlSchema,
	CreateDocumentVersionSchema,
	DeleteDocumentUploadResponseSchema,
	DeleteDocumentUploadSchema,
	DocumentDetailSchema,
	DocumentListResponseSchema,
	DocumentResponseSchema,
	GetDocumentByIdSchema,
	GetDocumentListSchema,
	UpdateDocumentSchema,
	UpdateDocumentStatusSchema,
} from "../schemas/document.schema";
import {
	PublishLegislativeDocumentResponseSchema,
	PublishLegislativeDocumentSchema,
} from "../schemas/legislative-document.schema";

export const getDocumentList = oc
	.route({
		method: "GET",
		path: "/admin/documents",
		summary: "Get document tracker list",
		description:
			"Admin endpoint to list documents with filtering, searching, sorting, and pagination.",
		tags: ["Documents", "Admin"],
	})
	.errors({
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		FORBIDDEN: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(GetDocumentListSchema)
	.output(DocumentListResponseSchema);

export const getDocumentById = oc
	.route({
		method: "GET",
		path: "/admin/documents/{id}",
		summary: "Get full document details",
		description:
			"Admin endpoint to retrieve document details, versions with signed URLs, and audit trail.",
		tags: ["Documents", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.DOCUMENT.NOT_FOUND,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		FORBIDDEN: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(GetDocumentByIdSchema)
	.output(DocumentDetailSchema);

export const createDocument = oc
	.route({
		method: "POST",
		path: "/admin/documents",
		summary: "Create a new document",
		description:
			"Admin endpoint to log a new document, create initial version, and create initial audit record.",
		tags: ["Documents", "Admin"],
	})
	.errors({
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
		DUPLICATE_CODE: ERRORS.DOCUMENT.DUPLICATE_CODE,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		FORBIDDEN: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(CreateDocumentSchema)
	.output(CreateDocumentResponseSchema);

export const updateDocumentStatus = oc
	.route({
		method: "PATCH",
		path: "/admin/documents/{id}/status",
		summary: "Update document status",
		description:
			"Admin endpoint to transition a document status with server-side flow and role validation.",
		tags: ["Documents", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.DOCUMENT.NOT_FOUND,
		INVALID_TRANSITION: ERRORS.DOCUMENT.INVALID_TRANSITION,
		FORBIDDEN: ERRORS.GENERAL.FORBIDDEN,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
	})
	.input(UpdateDocumentStatusSchema)
	.output(DocumentResponseSchema);

export const createDocumentVersion = oc
	.route({
		method: "POST",
		path: "/admin/documents/{id}/versions",
		summary: "Upload new document version",
		description:
			"Admin endpoint to create a new document version and optionally reset status to RECEIVED.",
		tags: ["Documents", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.DOCUMENT.NOT_FOUND,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		FORBIDDEN: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(CreateDocumentVersionSchema)
	.output(DocumentDetailSchema);

export const createDocumentUploadUrl = oc
	.route({
		method: "POST",
		path: "/admin/documents/upload-url",
		summary: "Create signed upload URL for document files",
		description:
			"Admin endpoint to generate a signed upload URL for direct PDF uploads to storage.",
		tags: ["Documents", "Admin"],
	})
	.errors({
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
		SIGNED_URL_FAILED: ERRORS.STORAGE.SIGNED_URL_FAILED,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		FORBIDDEN: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(CreateDocumentUploadUrlSchema)
	.output(CreateDocumentUploadUrlResponseSchema);

export const deleteDocumentUpload = oc
	.route({
		method: "POST",
		path: "/admin/documents/upload-cleanup",
		summary: "Cleanup a previously uploaded document file",
		description:
			"Admin endpoint to clean up uploaded files when document finalization fails.",
		tags: ["Documents", "Admin"],
	})
	.errors({
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		FORBIDDEN: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(DeleteDocumentUploadSchema)
	.output(DeleteDocumentUploadResponseSchema);

export const updateDocument = oc
	.route({
		method: "PATCH",
		path: "/admin/documents/{id}",
		summary: "Update document fields",
		description:
			"Admin endpoint to update editable document fields with status-based lock enforcement.",
		tags: ["Documents", "Admin"],
	})
	.errors({
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
		NOT_FOUND: ERRORS.DOCUMENT.NOT_FOUND,
		EDIT_LOCKED: ERRORS.DOCUMENT.EDIT_LOCKED,
		CONFLICT: ERRORS.DOCUMENT.VERSION_CONFLICT,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		FORBIDDEN: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(UpdateDocumentSchema)
	.output(DocumentResponseSchema);

export const publishDocument = oc
	.route({
		method: "POST",
		path: "/admin/documents/{documentId}/publish",
		summary: "Publish a calendared legislative document to archive",
		description:
			"Admin endpoint to publish a calendared legislative document and create/update archive metadata.",
		tags: ["Documents", "Admin"],
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

export const documentContract = {
	getList: getDocumentList,
	getById: getDocumentById,
	create: createDocument,
	updateStatus: updateDocumentStatus,
	update: updateDocument,
	publish: publishDocument,
	createVersion: createDocumentVersion,
	createUploadUrl: createDocumentUploadUrl,
	deleteUpload: deleteDocumentUpload,
};
