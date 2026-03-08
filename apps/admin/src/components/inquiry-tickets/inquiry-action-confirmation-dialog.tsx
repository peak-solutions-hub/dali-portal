"use client";

import { TEXT_LIMITS } from "@repo/shared";
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
import {
	AlertCircle,
	CheckCircle,
	UserCheck,
	UserMinus,
	UserPlus,
	XCircle,
} from "lucide-react";
import { useState } from "react";

export type InquiryActionType =
	| "assign_to"
	| "reassign_to"
	| "unassign"
	| "resolve"
	| "reject"
	| "request_assignment"
	| "confirm_assignment"
	| "review_reassignment";

interface InquiryActionConfirmationDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (remarks?: string) => void;
	onSecondaryConfirm?: () => void;
	actionType: InquiryActionType;
	isLoading?: boolean;
	/** Used by assign_to to show the target staff member's name */
	targetName?: string;
	/** Used by review_reassignment to show new assignee */
	reassignedToName?: string;
}

const ACTION_CONFIG = {
	assign_to: {
		title: "Assign Ticket",
		description:
			"This will assign the inquiry ticket to the selected staff member and mark it as 'Open'.",
		icon: UserPlus,
		iconColor: "text-blue-600",
		confirmButtonText: "Assign",
		confirmButtonVariant: "default" as const,
		requiresRemarks: false,
		remarksLabel: "",
		remarksPlaceholder: "",
	},
	reassign_to: {
		title: "Reassign Ticket",
		description:
			"This will request reassignment to the selected staff member. The current assignee must approve before it takes effect.",
		icon: UserPlus,
		iconColor: "text-blue-600",
		confirmButtonText: "Request Reassignment",
		confirmButtonVariant: "default" as const,
		requiresRemarks: false,
		remarksLabel: "",
		remarksPlaceholder: "",
	},
	unassign: {
		title: "Unassign Ticket",
		description:
			"This will remove the current assignee from this inquiry ticket.",
		icon: UserMinus,
		iconColor: "text-yellow-600",
		confirmButtonText: "Unassign",
		confirmButtonVariant: "outline" as const,
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
	request_assignment: {
		title: "Request Assignment",
		description:
			"This will notify assigners that you want to handle this inquiry.",
		icon: UserPlus,
		iconColor: "text-blue-600",
		confirmButtonText: "Request Assignment",
		confirmButtonVariant: "default" as const,
		requiresRemarks: false,
		remarksLabel: "",
		remarksPlaceholder: "",
	},
	confirm_assignment: {
		title: "Confirm Assignment",
		description: "Confirm that you will take ownership of this inquiry.",
		icon: UserCheck,
		iconColor: "text-green-600",
		confirmButtonText: "Confirm",
		confirmButtonVariant: "default" as const,
		requiresRemarks: false,
		remarksLabel: "",
		remarksPlaceholder: "",
	},
	review_reassignment: {
		title: "Reassignment Requested",
		description:
			"A reassignment has been requested for this inquiry. Approving will transfer ownership; rejecting will keep it with you.",
		icon: UserCheck,
		iconColor: "text-blue-600",
		confirmButtonText: "Approve",
		confirmButtonVariant: "default" as const,
		requiresRemarks: false,
		remarksLabel: "",
		remarksPlaceholder: "",
	},
} as const;

export function InquiryActionConfirmationDialog({
	isOpen,
	onClose,
	onConfirm,
	onSecondaryConfirm,
	actionType,
	isLoading = false,
	targetName,
	reassignedToName,
}: InquiryActionConfirmationDialogProps) {
	const [remarks, setRemarks] = useState("");
	const config = ACTION_CONFIG[actionType];
	const Icon = config.icon;

	const reviewDescription =
		actionType === "review_reassignment" && reassignedToName ? (
			<>
				This inquiry has been reassigned to <strong>{reassignedToName}</strong>.
				You can approve the reassignment or reject it to keep ownership.
			</>
		) : (
			config.description
		);

	const description =
		actionType === "assign_to" && targetName
			? `This will assign the inquiry ticket to ${targetName} and mark it as 'Open'.`
			: actionType === "reassign_to" && targetName
				? `This will request reassignment to ${targetName}. The current assignee must approve before it takes effect.`
				: reviewDescription;

	const handleConfirm = () => {
		if (config.requiresRemarks) {
			onConfirm(remarks);
		} else {
			onConfirm();
		}
		setRemarks("");
	};

	const handleSecondaryConfirm = () => {
		setRemarks("");
		onSecondaryConfirm?.();
	};

	const handleClose = () => {
		setRemarks("");
		onClose();
	};

	const isConfirmDisabled =
		isLoading || (config.requiresRemarks && !remarks.trim());
	const isReview = actionType === "review_reassignment";

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
						{description}
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
						<p
							className={`text-xs ${
								remarks.trim().length >= TEXT_LIMITS.SM
									? "text-destructive"
									: remarks.trim().length >= TEXT_LIMITS.SM * 0.9
										? "text-yellow-600"
										: "text-muted-foreground"
							}`}
						>
							{remarks.trim().length} / {TEXT_LIMITS.SM}
						</p>
					</div>
				)}

				{!config.requiresRemarks && actionType !== "reassign_to" && (
					<div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md border">
						<AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
						<p className="text-sm text-muted-foreground">
							{isReview ? (
								<>
									Approve: Transfer this inquiry to the requested assignee.
									<br />
									Reject: Keep this inquiry assigned to you.
								</>
							) : (
								description
							)}
						</p>
					</div>
				)}

				<DialogFooter>
					{!isReview && (
						<Button
							variant="outline"
							onClick={handleClose}
							disabled={isLoading}
						>
							Cancel
						</Button>
					)}
					{isReview ? (
						<>
							<Button
								variant="outline"
								onClick={handleSecondaryConfirm}
								disabled={isLoading}
							>
								Reject
							</Button>
							<Button
								variant={config.confirmButtonVariant}
								onClick={handleConfirm}
								disabled={isConfirmDisabled}
							>
								{config.confirmButtonText}
							</Button>
						</>
					) : (
						<Button
							variant={config.confirmButtonVariant}
							onClick={handleConfirm}
							disabled={isConfirmDisabled}
						>
							{config.confirmButtonText}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
