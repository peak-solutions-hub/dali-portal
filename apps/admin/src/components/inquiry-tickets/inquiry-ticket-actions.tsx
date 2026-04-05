import type {
	AssignableUserResponse,
	InquiryTicketWithMessagesResponse,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { AlertCircle, CheckCircle, UserCheck, XCircle } from "lucide-react";
import { useState } from "react";

interface InquiryTicketActionsProps {
	ticket: InquiryTicketWithMessagesResponse;
	/** Called when the Resolve button is clicked (opens confirmation dialog) */
	onResolve: () => void;
	/** Called when the Reject button is clicked (opens confirmation dialog) */
	onReject: () => void;
	/** Called with a user ID to assign, or null to unassign */
	onAssignTo: (userId: string | null) => void;
	/** Request assignment for current user */
	onRequestAssignment: () => void;
	/** Confirm current assignment */
	onConfirmAssignment: () => void;
	/** Review pending reassignment */
	onReviewReassignment: () => void;
	/** Whether a status update (resolve/reject) is in progress */
	isUpdating: boolean;
	/** Whether an assignment is in progress */
	isAssigningTo: boolean;
	/** Whether an assignment request is in progress */
	isRequestingAssignment: boolean;
	/** Whether a confirmation is in progress */
	isConfirmingAssignment: boolean;
	/** Whether reassignment approval/rejection is in progress */
	isReviewingReassignment: boolean;
	/** Whether the user can assign or reassign */
	canAssign: boolean;
	/** Whether the user can request assignment */
	canRequestAssignment: boolean;
	/** Whether the user can confirm assignment */
	canConfirmAssignment: boolean;
	/** Whether the user can review reassignment */
	canReviewReassignment: boolean;
	currentUserId?: string;
	staffList: AssignableUserResponse[];
	isLoadingStaff: boolean;
}

const UNASSIGNED_VALUE = "__unassigned__";

export function InquiryTicketActions({
	ticket,
	onResolve,
	onReject,
	onAssignTo,
	onRequestAssignment,
	onConfirmAssignment,
	onReviewReassignment,
	isUpdating,
	isAssigningTo,
	isRequestingAssignment,
	isConfirmingAssignment,
	isReviewingReassignment,
	canAssign,
	canRequestAssignment,
	canConfirmAssignment,
	canReviewReassignment,
	currentUserId,
	staffList,
	isLoadingStaff,
}: InquiryTicketActionsProps) {
	const isClosed = ticket.status === "resolved" || ticket.status === "rejected";

	if (isClosed) return null;
	const isAssignmentPending = ticket.assignmentStatus === "pending";
	const assignmentRequester = ticket.assignmentRequestedBy
		? staffList.find((user) => user.id === ticket.assignmentRequestedBy)
		: undefined;
	const hasPendingAssignmentRequest =
		canAssign && !ticket.assignedTo && !!ticket.assignmentRequestedBy;
	const [isAssigneePickerOpen, setIsAssigneePickerOpen] = useState(false);
	const isAssignedToCurrentUser =
		!!currentUserId && ticket.assignedTo === currentUserId;
	const isOwnedByAnotherStaff =
		!!ticket.assignedTo && ticket.assignedTo !== currentUserId;
	const canUpdateOutcome = isAssignedToCurrentUser;
	const showRequestAssignment = canRequestAssignment;
	const showConfirmAssignment = canConfirmAssignment;
	const showReviewReassignment = canReviewReassignment;
	const hasContextualAction =
		showRequestAssignment || showConfirmAssignment || showReviewReassignment;
	const shouldHideActions = isOwnedByAnotherStaff && !canAssign;
	const resolveDisabled =
		isUpdating ||
		!ticket.assignedTo ||
		isAssignmentPending ||
		!canUpdateOutcome;
	const rejectDisabled = isUpdating || isAssignmentPending || !canUpdateOutcome;

	if (shouldHideActions) return null;

	const currentValue = ticket.assignedTo ?? UNASSIGNED_VALUE;
	const isDisabled =
		isUpdating ||
		isAssigningTo ||
		isRequestingAssignment ||
		isConfirmingAssignment ||
		isReviewingReassignment;
	const isSelectDisabled = isDisabled || isLoadingStaff;

	return (
		<div className="space-y-3 px-6 pb-6 pt-2">
			<p className="text-xs font-medium text-muted-foreground">Actions</p>
			{hasPendingAssignmentRequest && (
				<div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
					<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
					<p>
						<span className="font-medium">
							{assignmentRequester?.fullName ?? "A staff member"}
						</span>{" "}
						has requested this inquiry. Assign it to{" "}
						<span className="font-medium">
							{assignmentRequester?.fullName ?? "the requester"}
						</span>{" "}
						to approve the request and let them handle it.
					</p>
				</div>
			)}
			<div
				className={
					canAssign
						? "flex items-center gap-2"
						: `grid gap-2 ${hasContextualAction ? "grid-cols-3" : "grid-cols-2"}`
				}
			>
				{/* Assignee selector — takes remaining space */}
				{canAssign && (
					<div className="flex-1">
						<Select
							value={currentValue}
							onOpenChange={setIsAssigneePickerOpen}
							onValueChange={(value) => {
								onAssignTo(value === UNASSIGNED_VALUE ? null : value);
							}}
							disabled={isSelectDisabled || !canAssign}
						>
							<SelectTrigger
								className={`h-8 text-xs w-full border-zinc-300 hover:border-zinc-400 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500 [&_svg:last-child]:rotate-180 ${
									hasPendingAssignmentRequest && !isAssigneePickerOpen
										? "border-amber-400 ring-2 ring-amber-300/70 shadow-[0_0_0_4px_rgba(252,211,77,0.18)] animate-pulse"
										: ""
								}`}
							>
								<div className="flex items-center gap-2 min-w-0">
									{ticket.assignedTo ? (
										<UserCheck className="h-4 w-4 shrink-0 text-primary" />
									) : (
										<UserCheck className="h-4 w-4 shrink-0 text-muted-foreground/50" />
									)}
									<SelectValue placeholder="Unassigned" />
								</div>
							</SelectTrigger>
							<SelectContent
								position="popper"
								side="top"
								sideOffset={4}
								className="w-(--radix-select-trigger-width) max-h-none"
							>
								<SelectItem value={UNASSIGNED_VALUE}>
									<span className="text-muted-foreground">Unassigned</span>
								</SelectItem>
								{staffList.map((user) => (
									<SelectItem
										key={user.id}
										value={user.id}
										className={
											user.id === ticket.assignmentRequestedBy &&
											isAssigneePickerOpen
												? "border border-amber-300 bg-amber-50 text-amber-900 shadow-[0_0_0_3px_rgba(252,211,77,0.18)] animate-pulse"
												: undefined
										}
									>
										{user.id === ticket.assignmentRequestedBy
											? `${user.fullName}${user.id === currentUserId ? " (You)" : ""} (Requested)`
											: user.id === currentUserId
												? `${user.fullName} (You)`
												: user.fullName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				{!canAssign && showRequestAssignment && (
					<Button
						variant="default"
						size="sm"
						onClick={onRequestAssignment}
						disabled={isDisabled}
						className="w-full min-w-0"
					>
						Request Assignment
					</Button>
				)}

				{!canAssign && showConfirmAssignment && (
					<Button
						variant="default"
						size="sm"
						onClick={onConfirmAssignment}
						disabled={isDisabled}
						className="w-full min-w-0"
					>
						Confirm Assignment
					</Button>
				)}

				{!canAssign && showReviewReassignment && (
					<Button
						variant="outline"
						size="sm"
						onClick={onReviewReassignment}
						disabled={isDisabled}
						className="w-full min-w-0"
					>
						Review Reassignment
					</Button>
				)}

				{canAssign && showRequestAssignment && (
					<Button
						variant="default"
						size="sm"
						onClick={onRequestAssignment}
						disabled={isDisabled}
						className="shrink-0"
					>
						Request Assignment
					</Button>
				)}

				{canAssign && showConfirmAssignment && (
					<Button
						variant="default"
						size="sm"
						onClick={onConfirmAssignment}
						disabled={isDisabled}
						className="shrink-0"
					>
						Confirm Assignment
					</Button>
				)}

				{canAssign && showReviewReassignment && (
					<Button
						variant="outline"
						size="sm"
						onClick={onReviewReassignment}
						disabled={isDisabled}
						className="shrink-0"
					>
						Review Reassignment
					</Button>
				)}

				{!canAssign ? (
					<>
						<Button
							variant="outline"
							size="sm"
							onClick={onResolve}
							disabled={resolveDisabled}
							className="flex w-full min-w-0 items-center justify-center gap-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 disabled:opacity-50 disabled:border-green-600/50 disabled:text-green-600/50"
						>
							<CheckCircle className="h-4 w-4" />
							Resolve
						</Button>

						<Button
							variant="outline"
							size="sm"
							onClick={onReject}
							disabled={rejectDisabled}
							className="flex w-full min-w-0 items-center justify-center gap-2 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700 disabled:opacity-50 disabled:border-red-600/50 disabled:text-red-600/50"
						>
							<XCircle className="h-4 w-4" />
							Reject
						</Button>
					</>
				) : (
					<>
						<Button
							variant="outline"
							size="sm"
							onClick={onResolve}
							disabled={resolveDisabled}
							className="flex items-center justify-center gap-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 disabled:opacity-50 disabled:border-green-600/50 disabled:text-green-600/50 shrink-0"
						>
							<CheckCircle className="h-4 w-4" />
							Resolve
						</Button>

						<Button
							variant="outline"
							size="sm"
							onClick={onReject}
							disabled={rejectDisabled}
							className="flex items-center justify-center gap-2 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700 disabled:opacity-50 disabled:border-red-600/50 disabled:text-red-600/50 shrink-0"
						>
							<XCircle className="h-4 w-4" />
							Reject
						</Button>
					</>
				)}
			</div>
		</div>
	);
}
