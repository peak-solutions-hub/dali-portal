"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	CLASSIFICATION_TYPE_VALUES,
	type ClassificationType,
	DOCUMENT_TYPE_VALUES,
	type DocumentType,
	FILE_SIZE_LIMITS,
	getAllowedPurposes,
	PURPOSE_TYPE_VALUES,
	type PurposeType,
	SOURCE_TYPE_VALUES,
	type SourceType,
	TEXT_LIMITS,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { DateTimePickerField } from "@repo/ui/components/date-time-picker-field";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api.client";
import {
	formatDocumentSource,
	formatDocumentType,
} from "@/utils/document-helpers";

interface LogDocumentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreated?: () => Promise<void> | void;
}

const formSchema = z
	.object({
		source: z.string().refine((value): value is SourceType => {
			return SOURCE_TYPE_VALUES.includes(value as SourceType);
		}, "Invalid source type"),
		type: z.string().refine((value): value is DocumentType => {
			return DOCUMENT_TYPE_VALUES.includes(value as DocumentType);
		}, "Invalid document type"),
		title: z
			.string()
			.trim()
			.min(1, "Title is required")
			.max(
				TEXT_LIMITS.SM,
				`Title must be ${TEXT_LIMITS.SM} characters or less`,
			),
		purpose: z.string().refine((value): value is PurposeType => {
			return PURPOSE_TYPE_VALUES.includes(value as PurposeType);
		}, "Invalid purpose type"),
		classification: z
			.string()
			.refine((value): value is ClassificationType => {
				return CLASSIFICATION_TYPE_VALUES.includes(value as ClassificationType);
			}, "Invalid classification")
			.optional(),
		remarks: z
			.string()
			.trim()
			.max(
				TEXT_LIMITS.MD,
				`Remarks must be ${TEXT_LIMITS.MD} characters or less`,
			)
			.optional(),
		eventVenue: z.string().trim().min(1, "Event venue is required").optional(),
		eventStartTime: z.string().optional(),
		eventEndTime: z.string().optional(),
	})
	.superRefine((input, ctx) => {
		if (
			!getAllowedPurposes(input.type as DocumentType).includes(input.purpose)
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["purpose"],
				message: "Invalid purpose for this document type",
			});
		}

		if (input.type !== "invitation" && !input.classification) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["classification"],
				message: "Classification is required",
			});
		}

		if (input.type === "invitation") {
			if (!input.eventVenue) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["eventVenue"],
					message: "Event venue is required for invitations",
				});
			}
			if (!input.eventStartTime) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["eventStartTime"],
					message: "Event start time is required for invitations",
				});
			}
			if (!input.eventEndTime) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["eventEndTime"],
					message: "Event end time is required for invitations",
				});
			}
		}
	});

type LogDocumentFormInput = z.input<typeof formSchema>;
type LogDocumentFormValues = z.output<typeof formSchema>;

const DEFAULT_SOURCE = SOURCE_TYPE_VALUES[0] as SourceType;
const DEFAULT_TYPE = DOCUMENT_TYPE_VALUES[0] as DocumentType;
const DEFAULT_PURPOSE = (getAllowedPurposes(DEFAULT_TYPE)[0] ??
	"for_filing") as PurposeType;
const DEFAULT_CLASSIFICATION =
	CLASSIFICATION_TYPE_VALUES[0] as ClassificationType;

const DEFAULT_VALUES: LogDocumentFormValues = {
	source: DEFAULT_SOURCE,
	type: DEFAULT_TYPE,
	title: "",
	purpose: DEFAULT_PURPOSE,
	classification: DEFAULT_CLASSIFICATION,
	remarks: "",
	eventVenue: "",
	eventStartTime: "",
	eventEndTime: "",
};

export function LogDocumentDialog({
	open,
	onOpenChange,
	onCreated,
}: LogDocumentDialogProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [fileError, setFileError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		reset,
		formState: { errors },
	} = useForm<LogDocumentFormInput, unknown, LogDocumentFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: DEFAULT_VALUES,
	});

	const selectedType = watch("type") as DocumentType;
	const selectedPurpose = watch("purpose") as PurposeType;
	const remarks = watch("remarks") ?? "";
	const title = watch("title") ?? "";
	const isInvitation = selectedType === "invitation";

	const allowedPurposes = useMemo(
		() => getAllowedPurposes(selectedType),
		[selectedType],
	);

	useEffect(() => {
		if (!open) {
			reset(DEFAULT_VALUES);
			setSelectedFile(null);
			setFileError(null);
		}
	}, [open, reset]);

	useEffect(() => {
		if (!allowedPurposes.includes(selectedPurpose)) {
			setValue("purpose", allowedPurposes[0] as PurposeType, {
				shouldValidate: true,
			});
		}
	}, [allowedPurposes, selectedPurpose, setValue]);

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

	const closeAndReset = () => {
		reset(DEFAULT_VALUES);
		setSelectedFile(null);
		setFileError(null);
		onOpenChange(false);
	};

	const onSubmit = async (values: LogDocumentFormValues) => {
		if (!selectedFile) {
			setFileError("Please upload a PDF file");
			return;
		}

		setIsSubmitting(true);
		setFileError(null);

		try {
			const [uploadErr, uploadData] = await api.documents.createUploadUrl({
				fileName: selectedFile.name,
				contentType: selectedFile.type as "application/pdf",
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

			const [createErr, createData] = await api.documents.create({
				source: values.source,
				type: values.type,
				title: values.title,
				purpose: values.purpose,
				classification: isInvitation ? null : (values.classification ?? null),
				remarks: values.remarks?.trim() ? values.remarks.trim() : null,
				filePath: uploadData.path,
				...(isInvitation &&
				values.eventVenue &&
				values.eventStartTime &&
				values.eventEndTime
					? {
							eventVenue: values.eventVenue,
							eventStartTime: new Date(values.eventStartTime).toISOString(),
							eventEndTime: new Date(values.eventEndTime).toISOString(),
						}
					: {}),
			});

			if (createErr || !createData) {
				throw createErr ?? new Error("Failed to create document");
			}

			toast.success(`Document logged: ${createData.codeNumber}`);
			await onCreated?.();
			closeAndReset();
		} catch (error) {
			const message =
				typeof error === "object" && error !== null && "message" in error
					? String(error.message)
					: "Failed to log document";

			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Log Document</DialogTitle>
					<DialogDescription>
						Add a new document to the tracker.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="source">Source</Label>
							<Select
								value={watch("source")}
								onValueChange={(value) =>
									setValue("source", value as SourceType, {
										shouldValidate: true,
									})
								}
							>
								<SelectTrigger id="source" className="w-full">
									<SelectValue placeholder="Select source" />
								</SelectTrigger>
								<SelectContent>
									{SOURCE_TYPE_VALUES.map((source) => (
										<SelectItem key={source} value={source}>
											{formatDocumentSource(source)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.source && (
								<p className="text-xs text-destructive">
									{errors.source.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="type">Type</Label>
							<Select
								value={selectedType}
								onValueChange={(value) =>
									setValue("type", value as DocumentType, {
										shouldValidate: true,
									})
								}
							>
								<SelectTrigger id="type" className="w-full">
									<SelectValue placeholder="Select type" />
								</SelectTrigger>
								<SelectContent>
									{DOCUMENT_TYPE_VALUES.map((type) => (
										<SelectItem key={type} value={type}>
											{formatDocumentType(type)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.type && (
								<p className="text-xs text-destructive">
									{errors.type.message}
								</p>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="title">Title</Label>
						<Input
							id="title"
							maxLength={TEXT_LIMITS.SM}
							placeholder="Enter title"
							{...register("title")}
						/>
						<div className="flex items-center justify-between">
							{errors.title ? (
								<p className="text-xs text-destructive">
									{errors.title.message}
								</p>
							) : (
								<span className="text-xs text-muted-foreground" />
							)}
							<p className="text-xs text-muted-foreground">
								{title.length}/{TEXT_LIMITS.SM}
							</p>
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="purpose">Purpose</Label>
							<Select
								value={selectedPurpose}
								onValueChange={(value) =>
									setValue("purpose", value as PurposeType, {
										shouldValidate: true,
									})
								}
							>
								<SelectTrigger id="purpose" className="w-full">
									<SelectValue placeholder="Select purpose" />
								</SelectTrigger>
								<SelectContent>
									{allowedPurposes.map((purpose) => (
										<SelectItem key={purpose} value={purpose}>
											{purpose.replaceAll("_", " ")}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.purpose && (
								<p className="text-xs text-destructive">
									{errors.purpose.message}
								</p>
							)}
						</div>

						{!isInvitation && (
							<div className="space-y-2">
								<Label htmlFor="classification">Classification</Label>
								<Select
									value={watch("classification") ?? ""}
									onValueChange={(value) =>
										setValue("classification", value as ClassificationType, {
											shouldValidate: true,
										})
									}
								>
									<SelectTrigger id="classification" className="w-full">
										<SelectValue placeholder="Select classification" />
									</SelectTrigger>
									<SelectContent>
										{CLASSIFICATION_TYPE_VALUES.map((classification) => (
											<SelectItem key={classification} value={classification}>
												{classification.replaceAll("_", " ")}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{errors.classification && (
									<p className="text-xs text-destructive">
										{errors.classification.message}
									</p>
								)}
							</div>
						)}
					</div>

					{/* Invitation-specific fields */}
					{isInvitation && (
						<>
							<div className="space-y-2">
								<Label htmlFor="eventVenue">Event Venue</Label>
								<Input
									id="eventVenue"
									placeholder="Enter the event venue"
									{...register("eventVenue")}
								/>
								{errors.eventVenue && (
									<p className="text-xs text-destructive">
										{errors.eventVenue.message}
									</p>
								)}
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="eventStartTime">Event Start</Label>
									<DateTimePickerField
										value={watch("eventStartTime") || null}
										onChange={(val) =>
											setValue("eventStartTime", val ?? "", {
												shouldValidate: true,
											})
										}
									/>
									{errors.eventStartTime && (
										<p className="text-xs text-destructive">
											{errors.eventStartTime.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="eventEndTime">Event End</Label>
									<DateTimePickerField
										value={watch("eventEndTime") || null}
										onChange={(val) =>
											setValue("eventEndTime", val ?? "", {
												shouldValidate: true,
											})
										}
									/>
									{errors.eventEndTime && (
										<p className="text-xs text-destructive">
											{errors.eventEndTime.message}
										</p>
									)}
								</div>
							</div>
						</>
					)}

					<div className="space-y-2">
						<Label htmlFor="remarks">Remarks (optional)</Label>
						<Textarea
							id="remarks"
							rows={3}
							maxLength={TEXT_LIMITS.MD}
							placeholder="Add remarks"
							{...register("remarks")}
						/>
						<div className="flex items-center justify-between">
							{errors.remarks ? (
								<p className="text-xs text-destructive">
									{errors.remarks.message}
								</p>
							) : (
								<span className="text-xs text-muted-foreground" />
							)}
							<p className="text-xs text-muted-foreground">
								{remarks.length}/{TEXT_LIMITS.MD}
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="documentFile">PDF File</Label>
						<Input
							id="documentFile"
							type="file"
							accept="application/pdf"
							onChange={(event) =>
								handleFileChange(event.target.files?.[0] ?? null)
							}
						/>
						{selectedFile && (
							<p className="text-xs text-muted-foreground">
								{selectedFile.name}
							</p>
						)}
						{fileError && (
							<p className="text-xs text-destructive">{fileError}</p>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={closeAndReset}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Submitting..." : "Submit"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
