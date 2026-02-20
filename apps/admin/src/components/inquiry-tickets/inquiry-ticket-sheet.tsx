"use client";

import { isDefinedError } from "@orpc/client";
import type {
	InquiryStatus,
	InquiryTicketWithMessagesResponse,
} from "@repo/shared";
import { Sheet, SheetContent, SheetTitle } from "@repo/ui/components/sheet";
import { createBrowserClient } from "@repo/ui/lib/supabase/client";
import { LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
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
import { InquiryConversation } from "./inquiry-conversation";
import { InquiryMessageComposer } from "./inquiry-message-composer";
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
		useState<InquiryTicketWithMessagesResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState("");
	const [files, setFiles] = useState<File[]>([]);
	const [uploadProgress, setUploadProgress] = useState(0);
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
			setMessage("");
			setFiles([]);
			if (ticketId) {
				await refreshTicket(ticketId);
			}
		},
		onUploadProgress: setUploadProgress,
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

	// Helper functions
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const newFiles = Array.from(e.target.files);
			// Limit to 3 files, 10MB each for replies
			const validFiles = newFiles.filter((f) => f.size <= 10 * 1024 * 1024);
			if (validFiles.length < newFiles.length) {
				alert("Some files were rejected (Max 10MB).");
			}
			setFiles((prev) => [...prev, ...validFiles].slice(0, 3));
		}
	};

	const removeFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const uploadFiles = async (): Promise<string[]> => {
		if (files.length === 0) return [];

		const supabase = createBrowserClient();
		const paths: string[] = [];

		for (const file of files) {
			const fileExt = file.name.split(".").pop();
			const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
			const filePath = `inquiries/replies/${fileName}`;

			const { error } = await supabase.storage
				.from("attachments")
				.upload(filePath, file);

			if (error) {
				console.error("Upload error", error);
				throw new Error("Failed to upload attachment");
			}
			paths.push(filePath);
		}
		return paths;
	};

	// Early return after all hooks are called
	if (!ticketId) return null;

	// Check if ticket is assigned to someone else (not the current user)
	const isAssignedToOther =
		ticket?.assignedTo && ticket.assignedTo !== userProfile?.id;

	// Action handlers
	const handleSendMessage = async () => {
		if (!ticketId || (!message.trim() && files.length === 0)) return;

		await sendMessage({
			ticketId,
			message,
			files,
			uploadFiles,
			senderName: userProfile?.fullName || "Staff Member",
		});
	};

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
							<div className="flex-1 min-h-0 overflow-hidden p-6">
								<InquiryConversation ticket={ticket} />
							</div>

							<div className="border-t bg-background p-6 shrink-0">
								{ticket.status === "resolved" ||
								ticket.status === "rejected" ? (
									<div className="p-4 bg-muted/30 rounded-lg border text-center">
										<p className="text-sm text-muted-foreground">
											This ticket has been{" "}
											{ticket.status === "resolved" ? "resolved" : "rejected"}{" "}
											and is now closed.
										</p>
									</div>
								) : isAssignedToOther ? (
									<div className="p-6 bg-muted/30 rounded-lg border text-center space-y-3">
										<div className="flex justify-center">
											<div className="p-3 bg-muted rounded-full">
												<LockKeyhole className="h-5 w-5 text-muted-foreground" />
											</div>
										</div>
										<div>
											<p className="text-sm font-medium text-foreground/80">
												Assigned to {ticket.user?.fullName}
											</p>
											<p className="text-xs text-muted-foreground mt-1">
												You cannot reply to or manage inquiries assigned to
												other staff members.
											</p>
										</div>
									</div>
								) : (
									<>
										<InquiryMessageComposer
											message={message}
											onMessageChange={setMessage}
											files={files}
											onFileChange={handleFileChange}
											onRemoveFile={removeFile}
											onSend={handleSendMessage}
											isSending={isSending}
											uploadProgress={uploadProgress}
											disabled={!ticket.assignedTo}
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
