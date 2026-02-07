import { Injectable, Logger } from "@nestjs/common";
import { AppError } from "@repo/shared";
import { SupabaseAdminService } from "./supabase-admin.service";

/** Default signed URL expiry time in seconds (1 hour) */
const DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 3600;

export interface SignedUrlResult {
	path: string;
	signedUrl: string | null;
	fileName: string;
}

export interface SignedUrlOptions {
	/** Expiry time in seconds (default: 3600 = 1 hour) */
	expiresIn?: number;
}

/**
 * Service for Supabase Storage operations.
 * Handles signed URL generation, file uploads, and bucket operations.
 */
@Injectable()
export class SupabaseStorageService {
	private readonly logger = new Logger(SupabaseStorageService.name);

	constructor(private readonly supabaseAdmin: SupabaseAdminService) {}

	/**
	 * Generate a signed URL for a single file path.
	 * Returns null signedUrl if generation fails (non-throwing).
	 */
	async getSignedUrl(
		bucket: string,
		path: string,
		options?: SignedUrlOptions,
	): Promise<SignedUrlResult> {
		const expiresIn = options?.expiresIn ?? DEFAULT_SIGNED_URL_EXPIRY_SECONDS;

		try {
			const supabase = this.supabaseAdmin.getClient();
			const { data, error } = await supabase.storage
				.from(bucket)
				.createSignedUrl(path, expiresIn);

			if (error) {
				this.logger.warn(
					`Failed to generate signed URL for ${bucket}/${path}: ${error.message}`,
				);
				return {
					path,
					signedUrl: null,
					fileName: this.extractFileName(path),
				};
			}

			return {
				path,
				signedUrl: data.signedUrl,
				fileName: this.extractFileName(path),
			};
		} catch (err) {
			this.logger.error(
				`Error generating signed URL for ${bucket}/${path}`,
				err,
			);
			return {
				path,
				signedUrl: null,
				fileName: this.extractFileName(path),
			};
		}
	}

	/**
	 * Generate signed URLs for multiple file paths.
	 * Returns array with null signedUrl for any paths that fail (non-throwing).
	 */
	async getSignedUrls(
		bucket: string,
		paths: string[],
		options?: SignedUrlOptions,
	): Promise<SignedUrlResult[]> {
		if (!paths || paths.length === 0) {
			return [];
		}

		const results = await Promise.all(
			paths.map((path) => this.getSignedUrl(bucket, path, options)),
		);

		return results;
	}

	/**
	 * Generate a signed URL for a single file path (throwing version).
	 * Throws STORAGE.SIGNED_URL_FAILED if generation fails.
	 */
	async getSignedUrlOrThrow(
		bucket: string,
		path: string,
		options?: SignedUrlOptions,
	): Promise<SignedUrlResult> {
		const expiresIn = options?.expiresIn ?? DEFAULT_SIGNED_URL_EXPIRY_SECONDS;

		const supabase = this.supabaseAdmin.getClient();
		const { data, error } = await supabase.storage
			.from(bucket)
			.createSignedUrl(path, expiresIn);

		if (error) {
			this.logger.error(
				`Failed to generate signed URL for ${bucket}/${path}: ${error.message}`,
			);
			throw new AppError("STORAGE.SIGNED_URL_FAILED");
		}

		return {
			path,
			signedUrl: data.signedUrl,
			fileName: this.extractFileName(path),
		};
	}

	/**
	 * Extract display-friendly file name from storage path.
	 * Removes timestamp prefixes if present (e.g., "1706123456789-file.pdf" -> "file.pdf")
	 */
	private extractFileName(path: string): string {
		const parts = path.split("/");
		const fileName = parts[parts.length - 1] || path;

		// Remove timestamp prefix if present (e.g., "1706123456789-abc123.pdf" -> "abc123.pdf")
		const match = fileName.match(/^\d+-(.+)$/);
		if (match) {
			return match[1];
		}

		return fileName;
	}
}
