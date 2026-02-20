"use client";

import { FILE_UPLOAD_PRESETS } from "@repo/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
	UploadError,
	UseSupabaseUploadReturn,
} from "./use-supabase-upload";
import { useSupabaseUpload } from "./use-supabase-upload";

export type FileUploadPreset = keyof typeof FILE_UPLOAD_PRESETS;

export interface UseFileUploadOptions {
	/** Upload preset (uses constants from shared) */
	preset?: FileUploadPreset;
	/** Custom path in bucket */
	path?: string;
	/** Override max files */
	maxFiles?: number;
	/** Override max file size */
	maxFileSize?: number;
	/** Override allowed mime types */
	allowedMimeTypes?: string[];
	/** Function to get signed upload URLs from backend */
	getSignedUploadUrls: (
		folder: string,
		fileNames: string[],
	) => Promise<
		Array<{ fileName: string; signedUrl: string; path: string; token: string }>
	>;
	/** Callback when upload succeeds */
	onUploadSuccess?: (paths: string[]) => void;
	/** Callback when upload fails */
	onUploadError?: (errors: UploadError[]) => void;
	/** Callback when validation error occurs */
	onValidationError?: (error: string) => void;
}

export interface UseFileUploadReturn extends UseSupabaseUploadReturn {
	/** Validation error message */
	validationError: string | null;
	/** Clear validation error */
	clearValidationError: () => void;
	/** Has any file errors */
	hasFileErrors: boolean;
	/** Count of valid files */
	validFileCount: number;
	/** Is max files reached */
	isMaxFilesReached: boolean;
	/** Whether files are currently being uploaded */
	isUploading: boolean;
	/** Preset config values */
	config: {
		maxFiles: number;
		maxFileSize: number;
		allowedMimeTypes: readonly string[];
	};
}

/**
 * Hook for file uploads with validation
 * Wraps useSupabaseUpload with additional validation and error handling
 */
export function useFileUpload(
	options: UseFileUploadOptions,
): UseFileUploadReturn {
	const {
		preset = "ATTACHMENTS",
		path = "inquiries",
		getSignedUploadUrls,
		onUploadSuccess,
		onUploadError,
		onValidationError,
	} = options;

	const [validationError, setValidationError] = useState<string | null>(null);

	// Get config from preset or overrides
	const config = useMemo(() => {
		const presetConfig = FILE_UPLOAD_PRESETS[preset];
		return {
			maxFiles: options.maxFiles ?? presetConfig.maxFiles,
			maxFileSize: options.maxFileSize ?? presetConfig.maxFileSize,
			allowedMimeTypes:
				options.allowedMimeTypes ?? presetConfig.allowedMimeTypes,
		};
	}, [preset, options.maxFiles, options.maxFileSize, options.allowedMimeTypes]);

	const uploadHook = useSupabaseUpload({
		path,
		maxFiles: config.maxFiles,
		maxFileSize: config.maxFileSize,
		allowedMimeTypes: [...config.allowedMimeTypes],
		getSignedUploadUrls,
		onUploadSuccess: (paths) => {
			setValidationError(null);
			onUploadSuccess?.(paths);
		},
		onUploadError: (errors) => {
			onUploadError?.(errors);
		},
	});

	const { files, errors, loading: isUploading } = uploadHook;

	// Compute derived values
	const hasFileErrors = useMemo(
		() => files.some((f) => f.errors && f.errors.length > 0),
		[files],
	);

	const validFileCount = useMemo(
		() => files.filter((f) => !f.errors || f.errors.length === 0).length,
		[files],
	);

	const isMaxFilesReached = files.length >= config.maxFiles;

	// Sync validation errors when files change
	useEffect(() => {
		// Check for file-level errors
		if (hasFileErrors) {
			const errorFile = files.find((f) => f.errors && f.errors.length > 0);
			const errorMsg = errorFile?.errors?.[0]?.message || "Invalid file";
			setValidationError(errorMsg);
			onValidationError?.(errorMsg);
		} else if (errors.length > 0) {
			// Check for upload-level errors
			const errorMsg = errors[0]?.message || "Upload failed";
			setValidationError(errorMsg);
			onValidationError?.(errorMsg);
		} else {
			// Clear errors when all files are valid
			setValidationError(null);
		}
	}, [files, errors, hasFileErrors, onValidationError]);

	const clearValidationError = useCallback(() => setValidationError(null), []);

	return {
		...uploadHook,
		validationError,
		clearValidationError,
		hasFileErrors,
		validFileCount,
		isMaxFilesReached,
		isUploading,
		config,
	};
}
