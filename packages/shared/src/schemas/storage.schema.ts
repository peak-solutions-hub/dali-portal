import { z } from "zod";
import { FILE_COUNT_LIMITS, TEXT_LIMITS } from "../constants";

/** Allowed file extensions for upload URL generation */
const ALLOWED_UPLOAD_EXTENSIONS = [
	".jpg",
	".jpeg",
	".png",
	".pdf",
	".doc",
	".docx",
];

/**
 * Request schema for generating signed upload URLs.
 * Used by frontend to request pre-signed URLs for direct uploads to Supabase.
 */
export const CreateSignedUploadUrlsSchema = z.object({
	/** Target folder in storage (e.g., "inquiries") */
	folder: z.string().min(1).max(100),
	/** Array of file names to generate upload URLs for */
	fileNames: z
		.array(
			z
				.string()
				.min(1)
				.max(
					TEXT_LIMITS.SM,
					`File name must be less than ${TEXT_LIMITS.SM} characters.`,
				)
				.refine(
					(name) => {
						const ext = name.substring(name.lastIndexOf(".")).toLowerCase();
						return ALLOWED_UPLOAD_EXTENSIONS.includes(ext);
					},
					{
						message: `Only ${ALLOWED_UPLOAD_EXTENSIONS.join(", ")} files are allowed.`,
					},
				),
		)
		.min(1)
		.max(FILE_COUNT_LIMITS.MD),
});

/**
 * Single signed upload URL result.
 */
export const SignedUploadUrlSchema = z.object({
	/** Original file name */
	fileName: z.string(),
	/** Full storage path (e.g., "inquiries/1706123456789-file.pdf") */
	path: z.string(),
	/** Pre-signed URL for uploading (PUT request) */
	signedUrl: z.url(),
	/** Token to include in the upload request */
	token: z.string(),
});

/**
 * Response schema for signed upload URLs.
 */
export const SignedUploadUrlsResponseSchema = z.object({
	/** Array of signed upload URL results */
	uploads: z.array(SignedUploadUrlSchema),
});

// Type exports
export type CreateSignedUploadUrlsInput = z.infer<
	typeof CreateSignedUploadUrlsSchema
>;
export type SignedUploadUrl = z.infer<typeof SignedUploadUrlSchema>;
export type SignedUploadUrlsResponse = z.infer<
	typeof SignedUploadUrlsResponseSchema
>;
