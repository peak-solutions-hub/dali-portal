"use client";

import { FILE_SIZE_LIMITS } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

const getUnknownErrorMessage = (error: unknown, fallback: string): string => {
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}

	if (typeof error === "object" && error !== null && "message" in error) {
		const maybeMessage = (error as { message?: unknown }).message;
		if (typeof maybeMessage === "string" && maybeMessage.trim()) {
			return maybeMessage;
		}
	}

	return fallback;
};

interface UploadNewVersionDialogProps {
	documentId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUploaded?: () => Promise<void> | void;
}

export function UploadNewVersionDialog({
	documentId,
	open,
	onOpenChange,
	onUploaded,
}: UploadNewVersionDialogProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const [resetStatus, setResetStatus] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const submitLockRef = useRef(false);

	useEffect(() => {
		if (!open) {
			setSelectedFile(null);
			setFileError(null);
			setResetStatus(true);
		}
	}, [open]);

	const handleFileChange = (file: File | null) => {
		setFileError(null);

		if (!file) {
			setSelectedFile(null);
			return;
		}

		if (file.type !== "application/pdf") {
			setSelectedFile(null);
			setFileError("Only PDF files are accepted");
			return;
		}

		if (file.size > FILE_SIZE_LIMITS.MD) {
			setSelectedFile(null);
			setFileError("File must be smaller than 25 MB");
			return;
		}

		setSelectedFile(file);
	};

	const closeDialog = () => {
		if (isSubmitting) {
			return;
		}

		onOpenChange(false);
	};

	const handleDialogOpenChange = (nextOpen: boolean) => {
		if (isSubmitting) {
			return;
		}

		onOpenChange(nextOpen);
	};

	const handleSubmit = async () => {
		if (!selectedFile) {
			setFileError("Please upload a PDF file");
			return;
		}

		if (submitLockRef.current) {
			return;
		}

		submitLockRef.current = true;

		setIsSubmitting(true);
		setFileError(null);
		let uploadedPath: string | null = null;

		try {
			const [uploadErr, uploadData] = await api.documents.createUploadUrl({
				documentId,
				fileName: selectedFile.name,
				contentType: "application/pdf",
				fileSizeBytes: selectedFile.size,
			});

			if (uploadErr || !uploadData) {
				throw uploadErr ?? new Error("Failed to create upload URL");
			}

			const uploadResponse = await fetch(uploadData.signedUrl, {
				method: "PUT",
				headers: {
					"Content-Type": selectedFile.type,
				},
				body: selectedFile,
			});

			if (!uploadResponse.ok) {
				throw new Error("Failed to upload PDF file");
			}

			uploadedPath = uploadData.path;

			const [createVersionError] = await api.documents.createVersion({
				id: documentId,
				filePath: uploadData.path,
				resetStatus,
			});

			if (createVersionError) {
				throw createVersionError;
			}

			toast.success("New version uploaded successfully");
			closeDialog();
			void onUploaded?.();
		} catch (error) {
			if (uploadedPath) {
				const [cleanupError, cleanupResult] = await api.documents.deleteUpload({
					path: uploadedPath,
					documentId,
				});

				if (cleanupError || !cleanupResult?.cleanedUp) {
					console.warn(
						"Document upload cleanup failed after version finalization error",
						{ cleanupError, uploadedPath },
					);
				}
			}

			const message = getUnknownErrorMessage(
				error,
				"Failed to upload new version",
			);

			setFileError(message);
			toast.error(message);
		} finally {
			submitLockRef.current = false;
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleDialogOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Upload New Version</DialogTitle>
					<DialogDescription>
						Upload a replacement PDF for this document version history.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="documentVersionFile">PDF File</Label>
						<Input
							id="documentVersionFile"
							type="file"
							accept="application/pdf"
							onChange={(event) =>
								handleFileChange(event.target.files?.[0] ?? null)
							}
						/>
						{selectedFile ? (
							<p className="text-xs text-muted-foreground">
								{selectedFile.name}
							</p>
						) : null}
						{fileError ? (
							<p className="text-xs text-destructive">{fileError}</p>
						) : null}
					</div>

					<label
						htmlFor="resetStatus"
						className="flex cursor-pointer items-center gap-2"
					>
						<Checkbox
							id="resetStatus"
							checked={resetStatus}
							onCheckedChange={(checked) => setResetStatus(checked === true)}
						/>
						<span className="text-sm text-foreground">
							Reset status to RECEIVED
						</span>
					</label>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={closeDialog}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting ? "Uploading Version..." : "Upload Version"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
