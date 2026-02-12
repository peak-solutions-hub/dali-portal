"use client";

import { isDefinedError } from "@orpc/client";
import type {
	InquiryStatus,
	InquiryTicketWithMessagesResponse,
} from "@repo/shared";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@repo/ui/components/sheet";
import { createBrowserClient } from "@repo/ui/lib/supabase/client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api.client";
import { createTicketHelpers } from "@/utils/inquiry-ticket-helpers";
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
}

export function InquiryTicketSheet({
	ticketId,
	isOpen,
	onClose,
}: InquiryTicketSheetProps) {
	const [ticket, setTicket] =
		useState<InquiryTicketWithMessagesResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [confirmationDialog, setConfirmationDialog] = useState<{
		isOpen: boolean;
		actionType: InquiryActionType | null;
	}>({
		isOpen: false,
		actionType: null,
	});

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

	if (!ticketId) return null;

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

	const helpers = createTicketHelpers(ticketId, message, files, uploadFiles, {
		onFilesClear: () => setFiles([]),
		onUploadProgress: setUploadProgress,
		onTicketUpdate: setTicket,
		onMessageClear: () => setMessage(""),
		onLoadingChange: setIsSending,
		onStatusLoadingChange: setIsUpdatingStatus,
	});

	const {
		handleSendMessage,
		handleAssignToMe,
		handleResolve,
		handleReject,
		confirmAssignToMe,
		confirmResolve,
		confirmReject,
	} = helpers;

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
				<SheetContent className="w-full sm:max-w-[50vw] p-0 overflow-y-auto">
					<SheetTitle className="sr-only">Inquiry Ticket</SheetTitle>
					{isLoading ? (
						<InquiryTicketSheetSkeleton />
					) : error ? (
						<InquiryTicketSheetError message={error} />
					) : ticket ? (
						<div className="flex h-full flex-col">
							<InquiryTicketHeader ticket={ticket} />

							{/* Scrollable Content */}
							<ScrollArea className="flex-1">
								<div className="space-y-6 p-6">
									<InquiryConversation ticket={ticket} />
								</div>
							</ScrollArea>

							<div className="border-t bg-background p-6">
								{ticket.status === "resolved" ||
								ticket.status === "rejected" ? (
									<div className="p-4 bg-muted/30 rounded-lg border text-center">
										<p className="text-sm text-muted-foreground">
											This ticket has been{" "}
											{ticket.status === "resolved" ? "resolved" : "rejected"}{" "}
											and is now closed.
										</p>
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
										/>

										<InquiryTicketActions
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
