"use client";

import {
	ALLOWED_MIME_TYPES,
	FILE_COUNT_LIMITS,
	FILE_SIZE_LIMITS,
	FILE_UPLOAD_PRESETS,
} from "@repo/shared";
import type {
	FileWithPreview,
	UploadError,
	UseSupabaseUploadOptions,
	UseSupabaseUploadReturn,
} from "@repo/ui/hooks/use-supabase-upload";
import { useSupabaseUpload } from "@repo/ui/hooks/use-supabase-upload";
import { createSupabaseBrowserClient } from "@repo/ui/lib/supabase/client";
import { useCallback, useEffect, useMemo, useState } from "react";

export type FileUploadPreset = keyof typeof FILE_UPLOAD_PRESETS;

export interface UseFileUploadOptions {
	/** Upload preset (uses constants from shared) */
	preset?: FileUploadPreset;
	/** Custom bucket name */
	bucketName?: string;
	/** Custom path in bucket */
	path?: string;
	/** Override max files */
	maxFiles?: number;
	/** Override max file size */
	maxFileSize?: number;
	/** Override allowed mime types */
	allowedMimeTypes?: string[];
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
	options: UseFileUploadOptions = {},
): UseFileUploadReturn {
	const {
		preset = "INQUIRY_ATTACHMENTS",
		bucketName = "attachments",
		path = "inquiries",
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

	const supabase = createSupabaseBrowserClient();

	const uploadHook = useSupabaseUpload({
		supabaseClient: supabase,
		bucketName,
		path,
		maxFiles: config.maxFiles,
		maxFileSize: config.maxFileSize,
		allowedMimeTypes: [...config.allowedMimeTypes],
		onUploadSuccess: (paths) => {
			setValidationError(null);
			onUploadSuccess?.(paths);
		},
		onUploadError: (errors) => {
			onUploadError?.(errors);
		},
	});

	const { files, errors } = uploadHook;

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
		config,
	};
}
