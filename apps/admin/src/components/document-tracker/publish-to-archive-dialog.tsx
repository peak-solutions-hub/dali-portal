"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api.client";
import { formatDocumentClassification } from "@/utils/document-helpers";

interface PublishToArchiveDialogProps {
	documentId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultCategory?: ClassificationType | null;
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
	seriesYear: z.coerce.number().int().min(1950).max(2100),
	dateEnacted: z.string().min(1, "Date enacted is required"),
	category: z.string().optional(),
});

type PublishFormInput = z.input<typeof formSchema>;
type PublishFormValues = z.output<typeof formSchema>;

const KEEP_CURRENT_CATEGORY = "__keep_current";

export function PublishToArchiveDialog({
	documentId,
	open,
	onOpenChange,
	defaultCategory,
	onPublished,
}: PublishToArchiveDialogProps) {
	const currentYear = new Date().getFullYear();

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<PublishFormInput, unknown, PublishFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			officialNumber: "",
			seriesYear: currentYear,
			dateEnacted: "",
			category: defaultCategory ?? KEEP_CURRENT_CATEGORY,
		},
	});

	useEffect(() => {
		if (!open) {
			reset({
				officialNumber: "",
				seriesYear: currentYear,
				dateEnacted: "",
				category: defaultCategory ?? KEEP_CURRENT_CATEGORY,
			});
		}
	}, [defaultCategory, currentYear, open, reset]);

	const categoryValue = watch("category") ?? KEEP_CURRENT_CATEGORY;

	const onSubmit = async (values: PublishFormValues) => {
		try {
			const [publishError] = await api.legislativeDocuments.publish({
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
				throw publishError;
			}

			toast.success("Document published to archive");
			await onPublished?.();
			onOpenChange(false);
		} catch (error) {
			const message =
				typeof error === "object" && error !== null && "message" in error
					? String(error.message)
					: "Failed to publish document";

			toast.error(message);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Publish to Archive</DialogTitle>
					<DialogDescription>
						Finalize this calendared document and publish it to the public
						legislative archive.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="officialNumber">Official Document Number</Label>
						<Input
							id="officialNumber"
							placeholder="e.g. 2026-001"
							maxLength={TEXT_LIMITS.SM}
							{...register("officialNumber")}
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
								type="number"
								min={1950}
								max={2100}
								{...register("seriesYear", { valueAsNumber: true })}
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
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Publishing..." : "Publish"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
