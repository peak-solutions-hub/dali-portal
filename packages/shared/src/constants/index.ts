export * from "./document-rules";
export * from "./errors";
export * from "./session-rules";

export const TEXT_LIMITS = {
	XS: 50, // names, etc
	SM: 280, // titles, subjects
	MD: 500, // Short descriptions, remarks
	LG: 1000,
} as const;

/**
 * File size limits in bytes
 * Using whole numbers for readability
 */
export const FILE_SIZE_LIMITS = {
	/** 5 MB */
	XS: 5_242_880,
	/** 10 MB */
	SM: 10_485_760,
	/** 25 MB */
	MD: 26_214_400,
	/** 50 MB */
	LG: 52_428_800,
} as const;

export const FILE_COUNT_LIMITS = {
	XS: 1, // 1 file
	SM: 3, // 3 files
	MD: 5, // 5 files
	LG: 8, // 8 files
} as const;

/**
 * Allowed MIME types for file uploads
 */
export const ALLOWED_MIME_TYPES = {
	IMAGES: ["image/jpeg", "image/jpg", "image/png"],
	DOCUMENTS: [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	],
	/** Images + Documents (default for most uploads) */
	ALL: [
		"image/jpeg",
		"image/jpg",
		"image/png",
		"application/pdf",
		"application/msword", // doc
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
	],
} as const;

/**
 * Maximum total attachments allowed across an entire inquiry conversation.
 * This is a server-enforced limit to prevent abuse.
 */
export const INQUIRY_MAX_TOTAL_ATTACHMENTS = 6;

/**
 * File upload presets for common use cases.
 *
 * NOTE: Inquiry initial attachments and chat message attachments share
 * the same limits — use `ATTACHMENTS` for both.
 */
export const FILE_UPLOAD_PRESETS = {
	/** Inquiry & chat attachments: 3 files, 5 MB each */
	ATTACHMENTS: {
		maxFiles: FILE_COUNT_LIMITS.SM,
		maxFileSize: FILE_SIZE_LIMITS.XS,
		allowedMimeTypes: ALLOWED_MIME_TYPES.ALL,
	},
	/** Single document upload: 1 file, 25 MB */
	SINGLE_DOCUMENT: {
		maxFiles: FILE_COUNT_LIMITS.XS,
		maxFileSize: FILE_SIZE_LIMITS.MD,
		allowedMimeTypes: ALLOWED_MIME_TYPES.ALL,
	},
} as const;
