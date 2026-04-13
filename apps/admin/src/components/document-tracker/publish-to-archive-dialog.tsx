"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isDefinedError } from "@orpc/client";
import {
	CLASSIFICATION_TYPE_VALUES,
	type ClassificationType,
	TEXT_LIMITS,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { DatePickerField } from "@repo/ui/components/date-picker-field";
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
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api.client";
import { formatDocumentClassification } from "@/utils/document-helpers";

const MIN_SERIES_YEAR = 1950;
const MAX_SERIES_YEAR = 2100;
const SERIES_YEAR_INPUT_MAX_LENGTH = 4;

interface PublishToArchiveDialogProps {
	documentId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultCategory?: ClassificationType | null;
	mode?: "publish" | "edit";
	onPublished?: () => Promise<void> | void;
}

const formSchema = z.object({
	officialNumber: z
		.string()
		.trim()
		.min(1, "Official document number is required")
		.max(
			TEXT_LIMITS.SM,
			`Official document number must be ${TEXT_LIMITS.SM} characters or less`,
		),
	seriesYear: z
		.string()
		.trim()
		.min(1, "Series year is required")
		.regex(/^\d{4}$/, "Series year must be a 4-digit year")
		.transform((value) => Number(value))
		.refine(
			(value) => value >= MIN_SERIES_YEAR && value <= MAX_SERIES_YEAR,
			`Series year must be between ${MIN_SERIES_YEAR} and ${MAX_SERIES_YEAR}`,
		),
	dateEnacted: z.string().min(1, "Date enacted is required"),
	category: z.string().optional(),
});

type PublishFormInput = z.input<typeof formSchema>;
type PublishFormValues = z.output<typeof formSchema>;

const KEEP_CURRENT_CATEGORY = "__keep_current";

function getErrorInfo(error: unknown): {
	status: number | null;
	code: string;
	message: string;
} {
	const maybeError =
		typeof error === "object" && error !== null
			? (error as {
					status?: unknown;
					code?: unknown;
					message?: unknown;
				})
			: null;

	const status =
		typeof maybeError?.status === "number" ? maybeError.status : null;
	const code =
		typeof maybeError?.code === "string" ? maybeError.code.toUpperCase() : "";
	const message =
		typeof maybeError?.message === "string"
			? maybeError.message
			: error instanceof Error
				? error.message
				: "";

	return {
		status,
		code,
		message,
	};
}

function getOfficialNumberConflictMessage(error: unknown): string | null {
	const { status, code, message } = getErrorInfo(error);
	const normalizedMessage = message.toLowerCase();

	const isConflict =
		status === 409 ||
		code === "CONFLICT" ||
		code === "GENERAL.CONFLICT" ||
		code.endsWith(".CONFLICT");
	const isStateConflict =
		normalizedMessage.includes("state changed") ||
		normalizedMessage.includes("please refresh");

	if (isConflict && !isStateConflict) {
		if (message) {
			return message;
		}

		return "This official document number is already in use. Please enter a different number.";
	}

	return null;
}

export function PublishToArchiveDialog({
	documentId,
	open,
	onOpenChange,
	defaultCategory,
	mode = "publish",
	onPublished,
}: PublishToArchiveDialogProps) {
	const currentYear = new Date().getFullYear();
	const isEditMode = mode === "edit";

	const {
		register,
		handleSubmit,
		setValue,
		setError,
		clearErrors,
		watch,
		reset,
		formState: { errors },
	} = useForm<PublishFormInput, unknown, PublishFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			officialNumber: "",
			seriesYear: String(currentYear),
			dateEnacted: "",
			category: defaultCategory ?? KEEP_CURRENT_CATEGORY,
		},
	});
	const [isPublishing, setIsPublishing] = useState(false);
	const publishLockRef = useRef(false);

	useEffect(() => {
		if (!open) {
			reset({
				officialNumber: "",
				seriesYear: String(currentYear),
				dateEnacted: "",
				category: defaultCategory ?? KEEP_CURRENT_CATEGORY,
			});
		}
	}, [defaultCategory, currentYear, open, reset]);

	const categoryValue = watch("category") ?? KEEP_CURRENT_CATEGORY;

	const handleDialogOpenChange = (nextOpen: boolean) => {
		if (isPublishing) {
			return;
		}

		onOpenChange(nextOpen);
	};

	const onSubmit = async (values: PublishFormValues) => {
		if (publishLockRef.current) {
			return;
		}

		clearErrors("officialNumber");

		publishLockRef.current = true;
		setIsPublishing(true);

		try {
			const [publishError] = await api.documents.publish({
				documentId,
				officialNumber: values.officialNumber,
				seriesYear: values.seriesYear,
				dateEnacted: values.dateEnacted,
				category:
					values.category && values.category !== KEEP_CURRENT_CATEGORY
						? (values.category as ClassificationType)
						: undefined,
			});

			if (publishError) {
				const conflictMessage = getOfficialNumberConflictMessage(publishError);

				if (conflictMessage) {
					setError("officialNumber", {
						type: "server",
						message: conflictMessage,
					});
					return;
				}

				if (isDefinedError(publishError)) {
					toast.error(publishError.message);
					return;
				}

				const { message } = getErrorInfo(publishError);
				const fallbackMessage = message || "Failed to publish document";

				toast.error(fallbackMessage);
				return;
			}

			toast.success(
				isEditMode
					? "Legislative archive details updated"
					: "Document published to archive",
			);
			onOpenChange(false);
			void onPublished?.();
		} catch (error) {
			const conflictMessage = getOfficialNumberConflictMessage(error);

			if (conflictMessage) {
				setError("officialNumber", {
					type: "server",
					message: conflictMessage,
				});
				return;
			}

			const { message } = getErrorInfo(error);
			toast.error(message || "Failed to publish document");
		} finally {
			publishLockRef.current = false;
			setIsPublishing(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleDialogOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{isEditMode
							? "Edit Legislative Archive Details"
							: "Publish to Archive"}
					</DialogTitle>
					<DialogDescription>
						{isEditMode
							? "Update official archive details for this published legislative document."
							: "Finalize this calendared document and publish it to the public legislative archive."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="officialNumber">Official Document Number</Label>
						<Input
							id="officialNumber"
							placeholder="e.g. 2026-001"
							maxLength={TEXT_LIMITS.SM}
							{...register("officialNumber", {
								onChange: () => {
									clearErrors("officialNumber");
								},
							})}
						/>
						{errors.officialNumber ? (
							<p className="text-xs text-destructive">
								{errors.officialNumber.message}
							</p>
						) : null}
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="seriesYear">Series Year</Label>
							<Input
								id="seriesYear"
								placeholder={String(currentYear)}
								inputMode="numeric"
								autoComplete="off"
								maxLength={SERIES_YEAR_INPUT_MAX_LENGTH}
								{...register("seriesYear", {
									onChange: (event) => {
										event.target.value = String(event.target.value ?? "")
											.replace(/\D/g, "")
											.slice(0, SERIES_YEAR_INPUT_MAX_LENGTH);
									},
								})}
							/>
							{errors.seriesYear ? (
								<p className="text-xs text-destructive">
									{errors.seriesYear.message}
								</p>
							) : null}
						</div>

						<div className="space-y-2">
							<Label htmlFor="dateEnacted">Date Enacted</Label>
							<DatePickerField
								value={watch("dateEnacted") || null}
								onChange={(val) =>
									setValue("dateEnacted", val ?? "", {
										shouldValidate: true,
									})
								}
							/>
							{errors.dateEnacted ? (
								<p className="text-xs text-destructive">
									{errors.dateEnacted.message}
								</p>
							) : null}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="specificCategory">Specific Category</Label>
						<Select
							value={categoryValue}
							onValueChange={(value) => {
								setValue("category", value, { shouldValidate: true });
							}}
						>
							<SelectTrigger id="specificCategory">
								<SelectValue placeholder="Select specific category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={KEEP_CURRENT_CATEGORY}>
									Keep current category
								</SelectItem>
								{CLASSIFICATION_TYPE_VALUES.map((classification) => (
									<SelectItem key={classification} value={classification}>
										{formatDocumentClassification(classification)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleDialogOpenChange(false)}
							disabled={isPublishing}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPublishing}>
							{isPublishing
								? isEditMode
									? "Updating Archive Details..."
									: "Publishing to Archive..."
								: isEditMode
									? "Save Archive Details"
									: "Publish to Archive"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
