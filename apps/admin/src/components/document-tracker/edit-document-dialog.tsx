"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	CLASSIFICATION_TYPE_VALUES,
	type ClassificationType,
	DOCUMENT_TYPE_VALUES,
	type DocumentType,
	getAllowedPurposes,
	PURPOSE_TYPE_VALUES,
	type PurposeType,
	SOURCE_TYPE_VALUES,
	type SourceType,
	type StatusType,
	TEXT_LIMITS,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { Lock } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api.client";
import {
	formatDocumentClassification,
	formatDocumentPurpose,
	formatDocumentSource,
	formatDocumentType,
} from "@/utils/document-helpers";

interface EditDocumentDialogProps {
	document: {
		id: string;
		title: string;
		remarks: string | null;
		source: string;
		type: string;
		purpose: string;
		classification: string | null;
		status: string;
	};
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUpdated?: () => Promise<void> | void;
}

const formSchema = z
	.object({
		title: z
			.string()
			.trim()
			.min(1, "Title is required")
			.max(
				TEXT_LIMITS.SM,
				`Title must be ${TEXT_LIMITS.SM} characters or less`,
			),
		remarks: z
			.string()
			.trim()
			.max(
				TEXT_LIMITS.MD,
				`Remarks must be ${TEXT_LIMITS.MD} characters or less`,
			)
			.optional(),
		source: z.string().refine((value): value is SourceType => {
			return SOURCE_TYPE_VALUES.includes(value as SourceType);
		}, "Invalid source type"),
		type: z.string().refine((value): value is DocumentType => {
			return DOCUMENT_TYPE_VALUES.includes(value as DocumentType);
		}, "Invalid document type"),
		purpose: z.string().refine((value): value is PurposeType => {
			return PURPOSE_TYPE_VALUES.includes(value as PurposeType);
		}, "Invalid purpose type"),
		classification: z.string().refine((value): value is ClassificationType => {
			return CLASSIFICATION_TYPE_VALUES.includes(value as ClassificationType);
		}, "Invalid classification type"),
	})
	.superRefine((input, ctx) => {
		if (
			!getAllowedPurposes(input.type as DocumentType).includes(
				input.purpose as PurposeType,
			)
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["purpose"],
				message: "Invalid purpose for this document type",
			});
		}
	});

type EditDocumentFormInput = z.input<typeof formSchema>;
type EditDocumentFormValues = z.output<typeof formSchema>;

export function EditDocumentDialog({
	document,
	open,
	onOpenChange,
	onUpdated,
}: EditDocumentDialogProps) {
	const isLocked = document.status !== "received";
	const effectiveClassification =
		document.classification ?? CLASSIFICATION_TYPE_VALUES[0];

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<EditDocumentFormInput, unknown, EditDocumentFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: document.title,
			remarks: document.remarks ?? "",
			source: document.source,
			type: document.type,
			purpose: document.purpose,
			classification: effectiveClassification,
		},
	});

	const selectedType = watch("type") as DocumentType;
	const selectedPurpose = watch("purpose") as PurposeType;

	const allowedPurposes = useMemo(
		() => getAllowedPurposes(selectedType),
		[selectedType],
	);

	useEffect(() => {
		if (open) {
			reset({
				title: document.title,
				remarks: document.remarks ?? "",
				source: document.source,
				type: document.type,
				purpose: document.purpose,
				classification: effectiveClassification,
			});
		}
	}, [document, effectiveClassification, open, reset]);

	useEffect(() => {
		if (!allowedPurposes.includes(selectedPurpose)) {
			setValue("purpose", allowedPurposes[0] as PurposeType, {
				shouldValidate: true,
			});
		}
	}, [allowedPurposes, selectedPurpose, setValue]);

	const onSubmit = async (values: EditDocumentFormValues) => {
		const payload: {
			id: string;
			title?: string;
			remarks?: string | null;
			source?: SourceType;
			type?: DocumentType;
			purpose?: PurposeType;
			classification?: ClassificationType;
		} = {
			id: document.id,
		};

		const nextTitle = values.title.trim();
		const nextRemarks = values.remarks?.trim() ? values.remarks.trim() : null;

		if (nextTitle !== document.title) {
			payload.title = nextTitle;
		}

		if (nextRemarks !== document.remarks) {
			payload.remarks = nextRemarks;
		}

		if (values.source !== document.source) {
			payload.source = values.source as SourceType;
		}

		if (!isLocked) {
			const typeChanged = values.type !== document.type;
			const purposeChanged = values.purpose !== document.purpose;

			if (typeChanged || purposeChanged) {
				payload.type = values.type as DocumentType;
				payload.purpose = values.purpose as PurposeType;
			}

			if (values.classification !== effectiveClassification) {
				payload.classification = values.classification as ClassificationType;
			}
		}

		if (Object.keys(payload).length === 1) {
			toast.info("No changes to save");
			onOpenChange(false);
			return;
		}

		try {
			const [updateError] = await api.documents.update(payload);

			if (updateError) {
				throw updateError;
			}

			toast.success("Document updated successfully");
			await onUpdated?.();
			onOpenChange(false);
		} catch (error) {
			const message =
				typeof error === "object" && error !== null && "message" in error
					? String(error.message)
					: "Failed to update document";

			toast.error(message);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Edit Document</DialogTitle>
					<DialogDescription>
						Update document details. Type, purpose, and classification are
						locked after the document leaves RECEIVED status.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="editTitle">Title</Label>
						<Input
							id="editTitle"
							{...register("title")}
							maxLength={TEXT_LIMITS.SM}
						/>
						{errors.title ? (
							<p className="text-xs text-destructive">{errors.title.message}</p>
						) : null}
					</div>

					<TooltipProvider delayDuration={200}>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="editSource">Source</Label>
								<Select
									value={watch("source")}
									onValueChange={(value) =>
										setValue("source", value as SourceType, {
											shouldValidate: true,
										})
									}
								>
									<SelectTrigger id="editSource" className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{SOURCE_TYPE_VALUES.map((source) => (
											<SelectItem key={source} value={source}>
												{formatDocumentSource(source)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<div className="flex items-center gap-1.5">
									<Label htmlFor="editType">Type</Label>
									{isLocked && (
										<Tooltip>
											<TooltipTrigger asChild>
												<Lock className="h-3.5 w-3.5 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent>
												<p>Locked — document is in workflow</p>
											</TooltipContent>
										</Tooltip>
									)}
								</div>
								<Select
									value={watch("type")}
									onValueChange={(value) =>
										setValue("type", value as DocumentType, {
											shouldValidate: true,
										})
									}
									disabled={isLocked}
								>
									<SelectTrigger id="editType" className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{DOCUMENT_TYPE_VALUES.map((type) => (
											<SelectItem key={type} value={type}>
												{formatDocumentType(type)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<div className="flex items-center gap-1.5">
									<Label htmlFor="editPurpose">Purpose</Label>
									{isLocked && (
										<Tooltip>
											<TooltipTrigger asChild>
												<Lock className="h-3.5 w-3.5 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent>
												<p>Locked — document is in workflow</p>
											</TooltipContent>
										</Tooltip>
									)}
								</div>
								<Select
									value={watch("purpose")}
									onValueChange={(value) =>
										setValue("purpose", value as PurposeType, {
											shouldValidate: true,
										})
									}
									disabled={isLocked}
								>
									<SelectTrigger id="editPurpose" className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{allowedPurposes.map((purpose) => (
											<SelectItem key={purpose} value={purpose}>
												{formatDocumentPurpose(purpose)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{errors.purpose ? (
									<p className="text-xs text-destructive">
										{errors.purpose.message}
									</p>
								) : null}
							</div>

							<div className="space-y-2">
								<div className="flex items-center gap-1.5">
									<Label htmlFor="editClassification">Classification</Label>
									{isLocked && (
										<Tooltip>
											<TooltipTrigger asChild>
												<Lock className="h-3.5 w-3.5 text-muted-foreground" />
											</TooltipTrigger>
											<TooltipContent>
												<p>Locked — document is in workflow</p>
											</TooltipContent>
										</Tooltip>
									)}
								</div>
								<Select
									value={watch("classification")}
									onValueChange={(value) =>
										setValue("classification", value as ClassificationType, {
											shouldValidate: true,
										})
									}
									disabled={isLocked}
								>
									<SelectTrigger id="editClassification" className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{CLASSIFICATION_TYPE_VALUES.map((classification) => (
											<SelectItem key={classification} value={classification}>
												{formatDocumentClassification(classification)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</TooltipProvider>

					{isLocked ? (
						<p className="text-xs text-muted-foreground">
							Type, purpose, and classification are locked because this document
							is already in workflow.
						</p>
					) : null}

					<div className="space-y-2">
						<Label htmlFor="editRemarks">Remarks</Label>
						<Textarea id="editRemarks" rows={3} {...register("remarks")} />
						{errors.remarks ? (
							<p className="text-xs text-destructive">
								{errors.remarks.message}
							</p>
						) : null}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
