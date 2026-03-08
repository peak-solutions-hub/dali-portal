"use client";

import { isDefinedError } from "@orpc/client";
import type { InquiryTicketWithMessagesAndAttachmentsResponse } from "@repo/shared";
import {
	INQUIRY_ASSIGNABLE_ROLES,
	INQUIRY_ASSIGNEES,
	INQUIRY_ASSIGNERS,
} from "@repo/shared";
import { ChatMessageList } from "@repo/ui/components/chat/chat-message-list";
import type { ChatItem } from "@repo/ui/components/chat/types";
import { ClosureRemarks } from "@repo/ui/components/closure-remarks";
import { MessageComposer } from "@repo/ui/components/message-composer";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@repo/ui/components/sheet";
import { LockKeyhole } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
	useApproveReassignment,
	useAssignTicketTo,
	useConcludeTicket,
	useConfirmAssignment,
	useRefreshTicket,
	useRejectReassignment,
	useRequestAssignment,
	useSendTicketMessage,
	useStaffList,
} from "@/hooks";
import { api } from "@/lib/api.client";
import {
	InquiryActionConfirmationDialog,
	type InquiryActionType,
} from "./inquiry-action-confirmation-dialog";
import { InquiryTicketActions } from "./inquiry-ticket-actions";
import { InquiryTicketHeader } from "./inquiry-ticket-header";
import {
	InquiryTicketSheetError,
	InquiryTicketSheetSkeleton,
} from "./inquiry-ticket-sheet-skeleton";

interface InquiryTicketSheetProps {
	ticketId: string | null;
	isOpen: boolean;
	onClose: () => void;
	onStatusUpdate?: () => void;
}

export function InquiryTicketSheet({
	ticketId,
	isOpen,
	onClose,
	onStatusUpdate,
}: InquiryTicketSheetProps) {
	const { userProfile } = useAuth();
	const [ticket, setTicket] =
		useState<InquiryTicketWithMessagesAndAttachmentsResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [confirmationDialog, setConfirmationDialog] = useState<{
		isOpen: boolean;
		actionType: InquiryActionType | null;
		pendingAssigneeId?: string | null;
		pendingAssigneeName?: string;
	}>({
		isOpen: false,
		actionType: null,
	});

	// Initialize hooks (must be called before any conditional returns)
	const { refresh: refreshTicket } = useRefreshTicket({
		onSuccess: (refreshedTicket) => {
			setTicket(refreshedTicket);
			onStatusUpdate?.();
		},
	});

	const { send: sendMessage, isSending } = useSendTicketMessage({
		onSuccess: async () => {
			if (ticketId) {
				await refreshTicket(ticketId);
			}
		},
	});

	const { assignTo, isAssigning: isAssigningTo } = useAssignTicketTo({
		onSuccess: async () => {
			if (ticketId) {
				await refreshTicket(ticketId);
			}
		},
	});

	const { users: staffList, isLoading: isLoadingStaff } = useStaffList({
		allowedRoles: INQUIRY_ASSIGNABLE_ROLES,
	});

	const { requestAssignment, isRequesting: isRequestingAssignment } =
		useRequestAssignment({
			onSuccess: async () => {
				if (ticketId) {
					await refreshTicket(ticketId);
				}
			},
		});

	const { confirmAssignment, isConfirming: isConfirmingAssignment } =
		useConfirmAssignment({
			onSuccess: async () => {
				if (ticketId) {
					await refreshTicket(ticketId);
				}
			},
		});

	const { approveReassignment, isApproving: isApprovingReassignment } =
		useApproveReassignment({
			onSuccess: async () => {
				if (ticketId) {
					await refreshTicket(ticketId);
				}
			},
		});

	const { rejectReassignment, isRejecting: isRejectingReassignment } =
		useRejectReassignment({
			onSuccess: async () => {
				if (ticketId) {
					await refreshTicket(ticketId);
				}
			},
		});

	const { conclude: concludeTicket, isConcluding } = useConcludeTicket({
		onSuccess: async () => {
			if (ticketId) {
				await refreshTicket(ticketId);
			}
		},
	});

	const isUpdatingStatus = isConcluding;
	const isReviewingReassignment =
		isApprovingReassignment || isRejectingReassignment;

	// Fetch ticket details when ticketId changes
	useEffect(() => {
		if (!ticketId) {
			setTicket(null);
			return;
		}

		async function fetchTicket() {
			if (!ticketId) return;

			setIsLoading(true);
			setError(null);

			const [err, result] = await api.inquiries.getWithMessages({
				id: ticketId,
			});

			if (err) {
				if (isDefinedError(err)) {
					setError(err.message);
				} else {
					setError("Failed to load ticket details");
				}
				setIsLoading(false);
				return;
			}

			setTicket(result);
			setIsLoading(false);
		}

		fetchTicket();
	}, [ticketId]);

	// Transform messages to ChatItem[] format (split messages and attachments)
	const chatItems = useMemo<ChatItem[]>(() => {
		if (!ticket) return [];

		return ticket.inquiryMessages.flatMap((msg) => {
			const items: ChatItem[] = [];

			const content = msg.content?.trim();

			if (content) {
				items.push({
					type: "message",
					id: msg.id,
					content: msg.content,
					senderType: msg.senderType,
					createdAt: msg.createdAt,
				});
			}

			if (msg.attachments && msg.attachments.length > 0) {
				for (const attachment of msg.attachments) {
					items.push({
						type: "attachment",
						id: `${msg.id}-${attachment.path}`,
						fileName: attachment.fileName,
						signedUrl: attachment.signedUrl,
						path: attachment.path,
						senderType: msg.senderType,
						createdAt: msg.createdAt,
					});
				}
			}

			return items;
		});
	}, [ticket]);

	// Count total attachments for conversation limit
	const totalAttachments = useMemo(() => {
		if (!ticket) return 0;
		return ticket.inquiryMessages.reduce(
			(sum, msg) => sum + (msg.attachments?.length || 0),
			0,
		);
	}, [ticket]);

	// Callback to get signed upload URLs from backend
	const getSignedUploadUrls = async (
		folder: string,
		fileNames: string[],
	): Promise<
		Array<{ fileName: string; signedUrl: string; path: string; token: string }>
	> => {
		const [err, result] = await api.inquiries.createUploadUrls({
			folder,
			fileNames,
		});

		if (err) {
			throw new Error(
				isDefinedError(err) ? err.message : "Failed to get upload URLs",
			);
		}

		return result.uploads;
	};

	// Send handler (wires MessageComposer → upload → API)
	const handleSend = async (
		content: string,
		fileCtx: {
			upload: () => Promise<{
				successes: { name: string; path: string }[];
				errors: { name: string; message: string }[];
			}>;
		},
	): Promise<boolean> => {
		if (!ticketId) return false;

		let attachmentPaths: string[] = [];

		// Upload files first (if any)
		const uploadResult = await fileCtx.upload();
		if (uploadResult.errors.length > 0) {
			return false;
		}
		if (uploadResult.successes.length > 0) {
			attachmentPaths = uploadResult.successes.map((s) => s.path);
		}

		const { success } = await sendMessage({
			ticketId,
			message: content || "(Attachment)",
			files: [], // No longer used, kept for hook compatibility
			uploadFiles: async () => attachmentPaths, // Return pre-uploaded paths
			senderName: userProfile?.fullName || "Staff Member",
		});

		return success;
	};

	// Early return after all hooks are called
	if (!ticketId) return null;

	// Check if ticket is assigned to someone else (not the current user)
	const isAssignedToOther =
		!!ticket?.assignedTo && ticket.assignedTo !== userProfile?.id;

	const isAssignedToCurrent = ticket?.assignedTo === userProfile?.id;

	const isAssignmentPending = ticket?.assignmentStatus === "pending";

	// Check if ticket is closed
	const isClosed =
		ticket?.status === "resolved" || ticket?.status === "rejected";

	const currentRole = userProfile?.role.name;
	const isAssigner = currentRole
		? INQUIRY_ASSIGNERS.includes(currentRole)
		: false;
	const isAssigneeEligible = currentRole
		? INQUIRY_ASSIGNEES.includes(currentRole)
		: false;
	const canRequestAssignment =
		!isAssigner &&
		isAssigneeEligible &&
		!ticket?.assignedTo &&
		!ticket?.assignmentRequestedBy;
	const canConfirmAssignment =
		!!isAssignedToCurrent && isAssignmentPending && !isClosed;
	const hasPendingReassignment =
		!!isAssignedToCurrent && !!ticket?.pendingReassignmentTo;
	const canReviewReassignment = hasPendingReassignment && !isClosed;
	const assignmentRequesterName = ticket?.assignmentRequestedBy
		? (staffList.find((user) => user.id === ticket.assignmentRequestedBy)
				?.fullName ?? "A staff member")
		: undefined;

	const reassignedToName = hasPendingReassignment
		? (staffList.find((user) => user.id === ticket?.pendingReassignmentTo)
				?.fullName ?? "another staff member")
		: undefined;

	// Action handlers
	const handleResolve = (onOpenDialog: () => void) => {
		onOpenDialog();
	};

	const handleReject = (onOpenDialog: () => void) => {
		onOpenDialog();
	};

	const handleAssignTo = (userId: string | null) => {
		if (!ticketId) return;
		if (userId === null) {
			setConfirmationDialog({ isOpen: true, actionType: "unassign" });
		} else {
			const staffMember = staffList.find((u) => u.id === userId);
			const name = staffMember
				? userId === userProfile?.id
					? `${staffMember.fullName} (You)`
					: staffMember.fullName
				: "the selected staff member";
			const isReassigningConfirmed =
				!!ticket?.assignedTo &&
				ticket.assignedTo !== userId &&
				ticket.assignmentStatus === "confirmed";
			setConfirmationDialog({
				isOpen: true,
				actionType: isReassigningConfirmed ? "reassign_to" : "assign_to",
				pendingAssigneeId: userId,
				pendingAssigneeName: name,
			});
		}
	};

	const handleRequestAssignment = () => {
		setConfirmationDialog({
			isOpen: true,
			actionType: "request_assignment",
		});
	};

	const handleConfirmAssignment = () => {
		setConfirmationDialog({
			isOpen: true,
			actionType: "confirm_assignment",
		});
	};

	const handleReviewReassignment = () => {
		setConfirmationDialog({
			isOpen: true,
			actionType: "review_reassignment",
		});
	};

	const confirmResolve = async (remarks: string) => {
		if (!ticketId) return;
		await concludeTicket(ticketId, "resolved", remarks);
	};

	const confirmReject = async (remarks: string) => {
		if (!ticketId) return;
		await concludeTicket(ticketId, "rejected", remarks);
	};

	const openConfirmationDialog = (actionType: InquiryActionType) => {
		setConfirmationDialog({ isOpen: true, actionType });
	};

	const closeConfirmationDialog = () => {
		setConfirmationDialog({ isOpen: false, actionType: null });
	};

	const handleConfirmAction = async (remarks?: string) => {
		if (!confirmationDialog.actionType) return;

		switch (confirmationDialog.actionType) {
			case "resolve":
				if (remarks) await confirmResolve(remarks);
				break;
			case "reject":
				if (remarks) await confirmReject(remarks);
				break;
			case "assign_to":
				if (ticketId && confirmationDialog.pendingAssigneeId !== undefined) {
					await assignTo(
						ticketId,
						confirmationDialog.pendingAssigneeId ?? null,
					);
				}
				break;
			case "reassign_to":
				if (ticketId && confirmationDialog.pendingAssigneeId !== undefined) {
					await assignTo(
						ticketId,
						confirmationDialog.pendingAssigneeId ?? null,
					);
				}
				break;
			case "unassign":
				if (ticketId) {
					await assignTo(ticketId, null);
				}
				break;
			case "request_assignment":
				if (ticketId) {
					await requestAssignment(ticketId);
				}
				break;
			case "confirm_assignment":
				if (ticketId) {
					await confirmAssignment(ticketId);
				}
				break;
			case "review_reassignment":
				if (ticketId) {
					await approveReassignment(ticketId);
				}
				break;
		}

		closeConfirmationDialog();
	};

	const handleSecondaryConfirmAction = async () => {
		if (confirmationDialog.actionType !== "review_reassignment") return;
		if (ticketId) {
			await rejectReassignment(ticketId);
		}
		closeConfirmationDialog();
	};

	return (
		<>
			<Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
				<SheetContent className="w-full sm:max-w-[50vw] p-0 overflow-hidden flex flex-col">
					<SheetTitle className="sr-only">Inquiry Ticket</SheetTitle>
					{isLoading ? (
						<InquiryTicketSheetSkeleton />
					) : error ? (
						<InquiryTicketSheetError message={error} />
					) : ticket ? (
						<div className="flex flex-1 flex-col min-h-0">
							<InquiryTicketHeader ticket={ticket} />

							{/* Scrollable Content */}
							<ScrollArea className="flex-1 min-h-0 p-6">
								<ChatMessageList
									items={chatItems}
									isSending={isSending}
									viewerType="staff"
								/>
							</ScrollArea>

							{isClosed && ticket.closureRemarks && (
								<div className="px-6 pb-4">
									<ClosureRemarks
										status={ticket.status as "resolved" | "rejected"}
										remarks={ticket.closureRemarks}
									/>
								</div>
							)}

							{isClosed ? (
								<>
									<MessageComposer
										isClosed={isClosed}
										closedStatus={ticket.status}
										staffName={ticket.user?.fullName ?? undefined}
										totalAttachments={totalAttachments}
										onSend={handleSend}
										isSending={isSending}
										getSignedUploadUrls={getSignedUploadUrls}
									/>
									<InquiryTicketActions
										ticket={ticket}
										onAssignTo={handleAssignTo}
										onResolve={() =>
											handleResolve(() => openConfirmationDialog("resolve"))
										}
										onReject={() =>
											handleReject(() => openConfirmationDialog("reject"))
										}
										isUpdating={isUpdatingStatus}
										isAssigningTo={isAssigningTo}
										isRequestingAssignment={isRequestingAssignment}
										isConfirmingAssignment={isConfirmingAssignment}
										isReviewingReassignment={isReviewingReassignment}
										canAssign={isAssigner}
										canRequestAssignment={canRequestAssignment}
										canConfirmAssignment={canConfirmAssignment}
										canReviewReassignment={canReviewReassignment}
										onRequestAssignment={handleRequestAssignment}
										onConfirmAssignment={handleConfirmAssignment}
										onReviewReassignment={handleReviewReassignment}
										currentUserId={userProfile?.id}
										staffList={staffList}
										isLoadingStaff={isLoadingStaff}
									/>
								</>
							) : isAssignedToOther ? (
								<>
									<div className="relative">
										<MessageComposer
											isClosed={isClosed}
											closedStatus={ticket.status}
											staffName={ticket.user?.fullName ?? undefined}
											totalAttachments={totalAttachments}
											onSend={handleSend}
											isSending={isSending}
											getSignedUploadUrls={getSignedUploadUrls}
										/>
										<div className="absolute inset-0 bg-muted/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 cursor-not-allowed border border-border">
											<LockKeyhole className="h-5 w-5 text-foreground" />
											<div className="w-full max-w-md px-6 text-center">
												<p className="text-xs text-foreground font-medium">
													Assigned to {ticket.user?.fullName}
												</p>
												<p className="text-[11px] text-muted-foreground">
													{isAssigner
														? "You can reassign this inquiry using the assignee picker below."
														: "You do not have permission to address this inquiry."}
												</p>
											</div>
										</div>
									</div>
									<InquiryTicketActions
										ticket={ticket}
										onAssignTo={handleAssignTo}
										onResolve={() =>
											handleResolve(() => openConfirmationDialog("resolve"))
										}
										onReject={() =>
											handleReject(() => openConfirmationDialog("reject"))
										}
										isUpdating={isUpdatingStatus}
										isAssigningTo={isAssigningTo}
										isRequestingAssignment={isRequestingAssignment}
										isConfirmingAssignment={isConfirmingAssignment}
										isReviewingReassignment={isReviewingReassignment}
										canAssign={isAssigner}
										canRequestAssignment={canRequestAssignment}
										canConfirmAssignment={canConfirmAssignment}
										canReviewReassignment={canReviewReassignment}
										onRequestAssignment={handleRequestAssignment}
										onConfirmAssignment={handleConfirmAssignment}
										onReviewReassignment={handleReviewReassignment}
										currentUserId={userProfile?.id}
										staffList={staffList}
										isLoadingStaff={isLoadingStaff}
									/>
								</>
							) : !ticket.assignedTo ? (
								<>
									{/* Disabled composer overlay — assign or request assignment to reply */}
									<div className="relative">
										<MessageComposer
											isClosed={isClosed}
											closedStatus={ticket.status}
											staffName={ticket.user?.fullName ?? undefined}
											totalAttachments={totalAttachments}
											onSend={handleSend}
											isSending={isSending}
											getSignedUploadUrls={getSignedUploadUrls}
										/>
										{/* Overlay sits on top and blocks click events by default */}
										<div className="absolute inset-0 bg-muted/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 cursor-not-allowed border border-border">
											<LockKeyhole className="h-5 w-5 text-foreground" />
											<div className="w-full max-w-md px-6 text-center">
												<p className="text-xs text-foreground font-medium">
													{ticket.assignmentRequestedBy
														? isAssigner
															? `${assignmentRequesterName} requested this inquiry`
															: "Assignment request pending approval"
														: isAssigner
															? "Assign this inquiry to reply"
															: "Request assignment to reply"}
												</p>
												{ticket.assignmentRequestedBy && (
													<p className="text-[11px] text-muted-foreground">
														{isAssigner
															? `Assign it to ${assignmentRequesterName} below to let them handle the inquiry.`
															: "An eligible assigner needs to approve your request before you can reply."}
													</p>
												)}
											</div>
										</div>
									</div>

									<InquiryTicketActions
										ticket={ticket}
										onAssignTo={handleAssignTo}
										onRequestAssignment={handleRequestAssignment}
										onConfirmAssignment={handleConfirmAssignment}
										onReviewReassignment={handleReviewReassignment}
										onResolve={() =>
											handleResolve(() => openConfirmationDialog("resolve"))
										}
										onReject={() =>
											handleReject(() => openConfirmationDialog("reject"))
										}
										isUpdating={isUpdatingStatus}
										isAssigningTo={isAssigningTo}
										isRequestingAssignment={isRequestingAssignment}
										isConfirmingAssignment={isConfirmingAssignment}
										isReviewingReassignment={isReviewingReassignment}
										canAssign={isAssigner}
										canRequestAssignment={canRequestAssignment}
										canConfirmAssignment={canConfirmAssignment}
										canReviewReassignment={canReviewReassignment}
										currentUserId={userProfile?.id}
										staffList={staffList}
										isLoadingStaff={isLoadingStaff}
									/>
								</>
							) : hasPendingReassignment ? (
								<>
									<div className="relative">
										<MessageComposer
											isClosed={isClosed}
											closedStatus={ticket.status}
											staffName={ticket.user?.fullName ?? undefined}
											totalAttachments={totalAttachments}
											onSend={handleSend}
											isSending={isSending}
											getSignedUploadUrls={getSignedUploadUrls}
										/>
										<div className="absolute inset-0 bg-muted/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 cursor-not-allowed border border-border">
											<LockKeyhole className="h-5 w-5 text-foreground" />
											<p className="text-xs text-foreground font-medium">
												Reassignment pending review
											</p>
										</div>
									</div>

									<InquiryTicketActions
										ticket={ticket}
										onAssignTo={handleAssignTo}
										onRequestAssignment={handleRequestAssignment}
										onConfirmAssignment={handleConfirmAssignment}
										onReviewReassignment={handleReviewReassignment}
										onResolve={() =>
											handleResolve(() => openConfirmationDialog("resolve"))
										}
										onReject={() =>
											handleReject(() => openConfirmationDialog("reject"))
										}
										isUpdating={isUpdatingStatus}
										isAssigningTo={isAssigningTo}
										isRequestingAssignment={isRequestingAssignment}
										isConfirmingAssignment={isConfirmingAssignment}
										isReviewingReassignment={isReviewingReassignment}
										canAssign={isAssigner}
										canRequestAssignment={canRequestAssignment}
										canConfirmAssignment={canConfirmAssignment}
										canReviewReassignment={canReviewReassignment}
										currentUserId={userProfile?.id}
										staffList={staffList}
										isLoadingStaff={isLoadingStaff}
									/>
								</>
							) : isAssignmentPending ? (
								<>
									<div className="relative">
										<MessageComposer
											isClosed={isClosed}
											closedStatus={ticket.status}
											staffName={ticket.user?.fullName ?? undefined}
											totalAttachments={totalAttachments}
											onSend={handleSend}
											isSending={isSending}
											getSignedUploadUrls={getSignedUploadUrls}
										/>
										<div className="absolute inset-0 bg-muted/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 cursor-not-allowed border border-border">
											<LockKeyhole className="h-5 w-5 text-foreground" />
											<p className="text-xs text-foreground font-medium">
												Confirm assignment to reply
											</p>
										</div>
									</div>

									<InquiryTicketActions
										ticket={ticket}
										onAssignTo={handleAssignTo}
										onRequestAssignment={handleRequestAssignment}
										onConfirmAssignment={handleConfirmAssignment}
										onReviewReassignment={handleReviewReassignment}
										onResolve={() =>
											handleResolve(() => openConfirmationDialog("resolve"))
										}
										onReject={() =>
											handleReject(() => openConfirmationDialog("reject"))
										}
										isUpdating={isUpdatingStatus}
										isAssigningTo={isAssigningTo}
										isRequestingAssignment={isRequestingAssignment}
										isConfirmingAssignment={isConfirmingAssignment}
										isReviewingReassignment={isReviewingReassignment}
										canAssign={isAssigner}
										canRequestAssignment={canRequestAssignment}
										canConfirmAssignment={canConfirmAssignment}
										canReviewReassignment={canReviewReassignment}
										currentUserId={userProfile?.id}
										staffList={staffList}
										isLoadingStaff={isLoadingStaff}
									/>
								</>
							) : (
								<>
									<MessageComposer
										isClosed={isClosed}
										closedStatus={ticket.status}
										staffName={ticket.user?.fullName ?? undefined}
										totalAttachments={totalAttachments}
										onSend={handleSend}
										isSending={isSending}
										getSignedUploadUrls={getSignedUploadUrls}
									/>

									<InquiryTicketActions
										ticket={ticket}
										onAssignTo={handleAssignTo}
										onRequestAssignment={handleRequestAssignment}
										onConfirmAssignment={handleConfirmAssignment}
										onReviewReassignment={handleReviewReassignment}
										onResolve={() =>
											handleResolve(() => openConfirmationDialog("resolve"))
										}
										onReject={() =>
											handleReject(() => openConfirmationDialog("reject"))
										}
										isUpdating={isUpdatingStatus}
										isAssigningTo={isAssigningTo}
										isRequestingAssignment={isRequestingAssignment}
										isConfirmingAssignment={isConfirmingAssignment}
										isReviewingReassignment={isReviewingReassignment}
										canAssign={isAssigner}
										canRequestAssignment={canRequestAssignment}
										canConfirmAssignment={canConfirmAssignment}
										canReviewReassignment={canReviewReassignment}
										currentUserId={userProfile?.id}
										staffList={staffList}
										isLoadingStaff={isLoadingStaff}
									/>
								</>
							)}
						</div>
					) : null}
				</SheetContent>
			</Sheet>

			<InquiryActionConfirmationDialog
				isOpen={confirmationDialog.isOpen}
				onClose={closeConfirmationDialog}
				onConfirm={handleConfirmAction}
				onSecondaryConfirm={handleSecondaryConfirmAction}
				actionType={confirmationDialog.actionType || "resolve"}
				isLoading={isUpdatingStatus || isAssigningTo}
				targetName={confirmationDialog.pendingAssigneeName}
				reassignedToName={reassignedToName}
			/>
		</>
	);
}
