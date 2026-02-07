"use client";

import { FILE_COUNT_LIMITS, FILE_SIZE_LIMITS } from "@repo/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useMemo, useRef, useState } from "react";
import type {
	FileError as DropzoneFileError,
	DropzoneOptions,
	FileRejection,
} from "react-dropzone";
import { useDropzone } from "react-dropzone";

export interface FileError {
	code: string;
	message: string;
}

export interface FileWithPreview extends File {
	preview?: string;
	errors: FileError[];
}

export interface UploadError {
	name: string;
	message: string;
}

export interface UseSupabaseUploadOptions {
	/**
	 * Supabase client instance (from app's client setup)
	 */
	supabaseClient: SupabaseClient;
	/**
	 * The name of the Supabase Storage bucket to upload to
	 */
	bucketName: string;
	/**
	 * The path or subfolder to upload the file to
	 */
	path: string;
	/**
	 * Allowed MIME types (e.g., ['image/*', 'application/pdf'])
	 */
	allowedMimeTypes?: string[];
	/**
	 * Maximum number of files to upload (default: 5)
	 */
	maxFiles?: number;
	/**
	 * Maximum file size in bytes (default: 50MB)
	 */
	maxFileSize?: number;
	/**
	 * Callback when upload succeeds
	 */
	onUploadSuccess?: (paths: string[]) => void;
	/**
	 * Callback when upload fails
	 */
	onUploadError?: (errors: UploadError[]) => void;
}

export interface UseSupabaseUploadReturn {
	files: FileWithPreview[];
	setFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>>;
	loading: boolean;
	successes: string[];
	errors: UploadError[];
	isSuccess: boolean;
	isDragActive: boolean;
	isDragReject: boolean;
	inputRef: React.RefObject<HTMLInputElement | null>;
	maxFiles: number;
	maxFileSize: number;
	/** True if any file has validation errors */
	hasFileErrors: boolean;
	/** True if the current file count >= maxFiles */
	isMaxFilesReached: boolean;
	/** Count of files without validation errors */
	validFileCount: number;
	getRootProps: ReturnType<typeof useDropzone>["getRootProps"];
	getInputProps: ReturnType<typeof useDropzone>["getInputProps"];
	onUpload: () => Promise<{
		successes: { name: string; path: string }[];
		errors: UploadError[];
	}>;
	reset: () => void;
}

/**
 * Hook for handling file uploads to Supabase Storage with drag-and-drop support.
 *
 * Adapted from Supabase UI's dropzone pattern for use in the DALI Portal.
 */
export function useSupabaseUpload({
	supabaseClient,
	bucketName,
	path,
	allowedMimeTypes = [],
	maxFiles = FILE_COUNT_LIMITS.MD,
	maxFileSize = FILE_SIZE_LIMITS.LG,
	onUploadSuccess,
	onUploadError,
}: UseSupabaseUploadOptions): UseSupabaseUploadReturn {
	const [files, setFilesInternal] = useState<FileWithPreview[]>([]);
	const [loading, setLoading] = useState(false);
	const [successes, setSuccesses] = useState<string[]>([]);
	const [errors, setErrors] = useState<UploadError[]>([]);
	const [isSuccess, setIsSuccess] = useState(false);

	const inputRef = useRef<HTMLInputElement | null>(null);

	/**
	 * Custom setFiles that clears "too-many-files" errors when files are
	 * removed to within the allowed limit.
	 */
	const setFiles: React.Dispatch<React.SetStateAction<FileWithPreview[]>> =
		useCallback(
			(action) => {
				setFilesInternal((prev) => {
					const newFiles = typeof action === "function" ? action(prev) : action;

					// If we're now within the max files limit, clear "too-many-files" errors
					if (newFiles.length <= maxFiles) {
						return newFiles.map((file) => {
							// Only clear too-many-files errors, keep other errors
							const hasTooManyFilesError = file.errors.some(
								(e) => e.code === "too-many-files",
							);
							if (hasTooManyFilesError) {
								return Object.assign(file, {
									errors: file.errors.filter(
										(e) => e.code !== "too-many-files",
									),
								});
							}
							return file;
						});
					}

					return newFiles;
				});
			},
			[maxFiles],
		);

	const onDrop = useCallback(
		(acceptedFiles: File[], fileRejections: FileRejection[]) => {
			// Add accepted files with preview
			const newFiles: FileWithPreview[] = acceptedFiles.map((file) =>
				Object.assign(file, {
					preview: file.type.startsWith("image/")
						? URL.createObjectURL(file)
						: "",
					errors: [],
				}),
			);

			// Add rejected files with their errors
			const rejectedFiles: FileWithPreview[] = fileRejections.map(
				({ file, errors: rejErrors }) =>
					Object.assign(file, {
						preview: "",
						errors: rejErrors.map((e: DropzoneFileError) => ({
							message: e.message,
							code: e.code,
						})),
					}),
			);

			setFilesInternal((prev) => [...prev, ...newFiles, ...rejectedFiles]);
			setIsSuccess(false);
			setErrors([]);
		},
		[],
	);

	const dropzoneOptions: DropzoneOptions = useMemo(
		() => ({
			onDrop,
			maxFiles,
			maxSize: maxFileSize,
			accept:
				allowedMimeTypes.length > 0
					? allowedMimeTypes.reduce(
							(acc, type) => {
								acc[type] = [];
								return acc;
							},
							{} as Record<string, string[]>,
						)
					: undefined,
		}),
		[onDrop, maxFiles, maxFileSize, allowedMimeTypes],
	);

	const { getRootProps, getInputProps, isDragActive, isDragReject } =
		useDropzone(dropzoneOptions);

	const onUpload = useCallback(async () => {
		const validFiles = files.filter((file) => file.errors.length === 0);

		// Edge case: No valid files to upload
		if (validFiles.length === 0) {
			if (files.length > 0) {
				// Files exist but all have errors
				const allErrors: UploadError[] = files
					.filter((f) => f.errors.length > 0)
					.map((f) => ({
						name: f.name,
						message: f.errors[0]?.message || "Invalid file",
					}));
				setErrors(allErrors);
				onUploadError?.(allErrors);
			}
			return { successes: [], errors: [] };
		}

		setLoading(true);
		setErrors([]);
		const newSuccesses: { name: string; path: string }[] = [];
		const newErrors: UploadError[] = [];

		for (const file of validFiles) {
			try {
				// Edge case: Validate file object
				if (!file || !file.name || file.size === 0) {
					newErrors.push({
						name: file?.name || "unknown",
						message: "Invalid or empty file",
					});
					continue;
				}

				const fileExt = file.name.split(".").pop();
				// Edge case: Missing file extension
				if (!fileExt) {
					newErrors.push({
						name: file.name,
						message: "File must have an extension",
					});
					continue;
				}

				const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
				const filePath = path ? `${path}/${fileName}` : fileName;

				const { error } = await supabaseClient.storage
					.from(bucketName)
					.upload(filePath, file);

				if (error) {
					newErrors.push({ name: file.name, message: error.message });
				} else {
					newSuccesses.push({ name: file.name, path: filePath });
				}
			} catch (err) {
				newErrors.push({
					name: file.name,
					message:
						err instanceof Error ? err.message : "Unexpected upload error",
				});
			}
		}

		// Update state for backward compatibility
		setSuccesses(newSuccesses.map((s) => s.name));
		setErrors(newErrors);
		setLoading(false);

		if (newErrors.length === 0 && newSuccesses.length > 0) {
			setIsSuccess(true);
			onUploadSuccess?.(newSuccesses.map((s) => s.path));
		} else if (newErrors.length > 0) {
			onUploadError?.(newErrors);
		}

		return { successes: newSuccesses, errors: newErrors };
	}, [files, supabaseClient, bucketName, path, onUploadSuccess, onUploadError]);

	const reset = useCallback(() => {
		// Revoke object URLs to prevent memory leaks
		for (const file of files) {
			if (file.preview) {
				URL.revokeObjectURL(file.preview);
			}
		}
		setFilesInternal([]);
		setSuccesses([]);
		setErrors([]);
		setIsSuccess(false);
		setLoading(false);
	}, [files]);

	// Computed values for validation state
	const hasFileErrors = useMemo(
		() => files.some((f) => f.errors.length > 0),
		[files],
	);

	const isMaxFilesReached = useMemo(
		() => files.length >= maxFiles,
		[files.length, maxFiles],
	);

	// Count of valid files (without errors)
	const validFileCount = useMemo(
		() => files.filter((f) => f.errors.length === 0).length,
		[files],
	);

	return {
		files,
		setFiles,
		loading,
		successes,
		errors,
		isSuccess,
		isDragActive,
		isDragReject,
		inputRef,
		maxFiles,
		maxFileSize,
		hasFileErrors,
		isMaxFilesReached,
		validFileCount,
		getRootProps,
		getInputProps,
		onUpload,
		reset,
	};
}
