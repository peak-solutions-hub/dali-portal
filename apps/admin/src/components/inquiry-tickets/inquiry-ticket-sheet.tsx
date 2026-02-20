"use client";

import { isDefinedError } from "@orpc/client";
import type { InquiryTicketWithMessagesAndAttachmentsResponse } from "@repo/shared";
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
	useAssignTicket,
	useConcludeTicket,
	useRefreshTicket,
	useSendTicketMessage,
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

	const { assignToMe } = useAssignTicket({
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
		ticket?.assignedTo && ticket.assignedTo !== userProfile?.id;

	// Check if ticket is closed
	const isClosed =
		ticket?.status === "resolved" || ticket?.status === "rejected";

	// Action handlers
	const handleAssignToMe = (onOpenDialog: () => void) => {
		onOpenDialog();
	};

	const handleResolve = (onOpenDialog: () => void) => {
		onOpenDialog();
	};

	const handleReject = (onOpenDialog: () => void) => {
		onOpenDialog();
	};

	const confirmAssignToMe = async () => {
		if (!ticketId) return;
		await assignToMe(ticketId);
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
			case "assign":
				await confirmAssignToMe();
				break;
			case "resolve":
				if (remarks) await confirmResolve(remarks);
				break;
			case "reject":
				if (remarks) await confirmReject(remarks);
				break;
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

							{isAssignedToOther ? (
								<div className="p-6 bg-muted/30 flex items-center gap-4">
									<div className="p-3 bg-muted rounded-full">
										<LockKeyhole className="h-5 w-5 text-muted-foreground" />
									</div>
									<div>
										<p className="text-sm font-medium text-foreground/80">
											Assigned to {ticket.user?.fullName}
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											You cannot reply to or manage inquiries assigned to other
											staff members.
										</p>
									</div>
								</div>
							) : !ticket.assignedTo ? (
								<div className="p-6 bg-muted/30 text-center space-y-3">
									<p className="text-sm text-muted-foreground">
										This inquiry is unassigned. Assign it to yourself to reply.
									</p>
								</div>
							) : (
								<>
									<MessageComposer
										isClosed={isClosed}
										closedStatus={ticket.status}
										totalAttachments={totalAttachments}
										onSend={handleSend}
										isSending={isSending}
										getSignedUploadUrls={getSignedUploadUrls}
									/>

									<InquiryTicketActions
										ticket={ticket}
										onAssign={() =>
											handleAssignToMe(() => openConfirmationDialog("assign"))
										}
										onResolve={() =>
											handleResolve(() => openConfirmationDialog("resolve"))
										}
										onReject={() =>
											handleReject(() => openConfirmationDialog("reject"))
										}
										isUpdating={isUpdatingStatus}
										currentUserId={userProfile?.id}
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
				actionType={confirmationDialog.actionType || "assign"}
				isLoading={isUpdatingStatus}
			/>
		</>
	);
}
