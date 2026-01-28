"use client";

import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { AlertCircle, CheckCircle, UserPlus, XCircle } from "lucide-react";
import { useState } from "react";

export type InquiryActionType = "assign" | "resolve" | "reject";

interface InquiryActionConfirmationDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (remarks?: string) => void;
	actionType: InquiryActionType;
	isLoading?: boolean;
}

const ACTION_CONFIG = {
	assign: {
		title: "Assign to Me",
		description:
			"This will assign the inquiry ticket to you and mark it as 'Open'. You will be responsible for handling this inquiry.",
		icon: UserPlus,
		iconColor: "text-blue-600",
		confirmButtonText: "Assign to Me",
		confirmButtonVariant: "default" as const,
		requiresRemarks: false,
		remarksLabel: "",
		remarksPlaceholder: "",
	},
	resolve: {
		title: "Resolve Inquiry",
		description:
			"This will mark the inquiry as resolved. Please provide closure remarks to document the resolution.",
		icon: CheckCircle,
		iconColor: "text-green-600",
		confirmButtonText: "Resolve",
		confirmButtonVariant: "default" as const,
		requiresRemarks: true,
		remarksLabel: "Closure Remarks",
		remarksPlaceholder:
			"Describe how this inquiry was resolved and any relevant details...",
	},
	reject: {
		title: "Reject Inquiry",
		description:
			"This will mark the inquiry as rejected. Please provide a reason for the rejection.",
		icon: XCircle,
		iconColor: "text-red-600",
		confirmButtonText: "Reject",
		confirmButtonVariant: "destructive" as const,
		requiresRemarks: true,
		remarksLabel: "Rejection Reason",
		remarksPlaceholder: "Explain why this inquiry is being rejected...",
	},
} as const;

export function InquiryActionConfirmationDialog({
	isOpen,
	onClose,
	onConfirm,
	actionType,
	isLoading = false,
}: InquiryActionConfirmationDialogProps) {
	const [remarks, setRemarks] = useState("");
	const config = ACTION_CONFIG[actionType];
	const Icon = config.icon;

	const handleConfirm = () => {
		if (config.requiresRemarks) {
			onConfirm(remarks);
		} else {
			onConfirm();
		}
		setRemarks("");
	};

	const handleClose = () => {
		setRemarks("");
		onClose();
	};

	const isConfirmDisabled =
		isLoading || (config.requiresRemarks && !remarks.trim());

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent className="sm:max-w-125">
				<DialogHeader>
					<div className="flex items-center gap-3 mb-2">
						<div className={`p-2 rounded-full bg-muted ${config.iconColor}`}>
							<Icon className="h-5 w-5" />
						</div>
						<DialogTitle>{config.title}</DialogTitle>
					</div>
					<DialogDescription className="text-left">
						{config.description}
					</DialogDescription>
				</DialogHeader>

				{config.requiresRemarks && (
					<div className="space-y-2">
						<Label htmlFor="remarks">{config.remarksLabel}</Label>
						<Textarea
							id="remarks"
							value={remarks}
							onChange={(e) => setRemarks(e.target.value)}
							placeholder={config.remarksPlaceholder}
							rows={4}
							disabled={isLoading}
							className="resize-none"
						/>
						{remarks.trim() && (
							<p className="text-xs text-muted-foreground">
								{remarks.trim().length} characters
							</p>
						)}
					</div>
				)}

				{!config.requiresRemarks && (
					<div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md border">
						<AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
						<p className="text-sm text-muted-foreground">
							Are you sure you want to proceed with this action?
						</p>
					</div>
				)}

				<DialogFooter>
					<Button variant="outline" onClick={handleClose} disabled={isLoading}>
						Cancel
					</Button>
					<Button
						variant={config.confirmButtonVariant}
						onClick={handleConfirm}
						disabled={isConfirmDisabled}
					>
						{config.confirmButtonText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
