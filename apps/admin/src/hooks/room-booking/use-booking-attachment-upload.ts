"use client";

import type { AttachmentMimeType } from "@repo/shared";
import { api } from "@/lib/api.client";

export interface BookingAttachmentUploadInput {
	file: File;
	reason?: string;
}

export interface BookingAttachmentUploadProgress {
	overallProgress: number;
	uploadedCount: number;
	totalCount: number;
}

function inferAttachmentMimeType(file: File): AttachmentMimeType {
	const mimeType = file.type.toLowerCase();
	if (
		mimeType === "application/pdf" ||
		mimeType === "image/jpeg" ||
		mimeType === "image/jpg" ||
		mimeType === "image/png" ||
		mimeType === "application/msword" ||
		mimeType ===
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	) {
		return mimeType as AttachmentMimeType;
	}

	const extension = file.name.split(".").pop()?.toLowerCase();
	if (extension === "pdf") return "application/pdf";
	if (extension === "jpeg") return "image/jpeg";
	if (extension === "jpg") return "image/jpg";
	if (extension === "png") return "image/png";
	if (extension === "doc") return "application/msword";
	if (extension === "docx") {
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
	}

	throw new Error(
		"Unsupported attachment type. Please upload PDF, PNG, JPG/JPEG, DOC, or DOCX.",
	);
}

function uploadFileWithProgress(
	uploadUrl: string,
	file: File,
	onProgress: (progressPercent: number) => void,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", uploadUrl);
		xhr.setRequestHeader(
			"Content-Type",
			file.type || "application/octet-stream",
		);

		xhr.upload.onprogress = (event) => {
			if (!event.lengthComputable) {
				return;
			}

			const progress = Math.round((event.loaded / event.total) * 100);
			onProgress(progress);
		};

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				onProgress(100);
				resolve();
				return;
			}

			reject(new Error(`Failed to upload attachment (${xhr.status})`));
		};

		xhr.onerror = () => {
			reject(new Error("Failed to upload attachment. Please try again."));
		};

		xhr.send(file);
	});
}

export async function uploadBookingAttachments(
	attachments: BookingAttachmentUploadInput[],
	onProgress?: (progress: BookingAttachmentUploadProgress) => void,
): Promise<Array<{ path: string; reason: string | undefined }>> {
	if (attachments.length === 0) {
		return [];
	}

	const totalFiles = attachments.length;
	const uploaded: Array<{ path: string; reason: string | undefined }> = [];
	onProgress?.({
		overallProgress: 0,
		uploadedCount: 0,
		totalCount: totalFiles,
	});

	for (const [index, attachment] of attachments.entries()) {
		const mimeType = inferAttachmentMimeType(attachment.file);
		const [uploadErr, uploadData] = await api.roomBookings.generateUploadUrl({
			fileName: attachment.file.name,
			mimeType,
			fileSize: attachment.file.size,
		});

		if (uploadErr || !uploadData) {
			throw new Error(uploadErr?.message || "Failed to generate upload URL");
		}

		await uploadFileWithProgress(
			uploadData.uploadUrl,
			attachment.file,
			(progressPercent) => {
				onProgress?.({
					overallProgress: Math.round(
						((index + progressPercent / 100) / totalFiles) * 100,
					),
					uploadedCount: index,
					totalCount: totalFiles,
				});
			},
		);

		uploaded.push({
			path: uploadData.path,
			reason: attachment.reason?.trim() || undefined,
		});

		onProgress?.({
			overallProgress: Math.round(((index + 1) / totalFiles) * 100),
			uploadedCount: index + 1,
			totalCount: totalFiles,
		});
	}

	return uploaded;
}
