"use client";

import { isDefinedError } from "@orpc/client";
import {
	formatCitizenFullName,
	formatDateTimeInPHT,
	type InquiryTicketWithMessagesAndAttachmentsResponse,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader } from "@repo/ui/components/card";
import { ChatMessageList } from "@repo/ui/components/chat/chat-message-list";
import type { ChatItem } from "@repo/ui/components/chat/types";
import { ClosureRemarks } from "@repo/ui/components/closure-remarks";
import { MessageComposer } from "@repo/ui/components/message-composer";
import {
	Mail,
	MessageSquare,
	MoveLeft,
	Ticket,
} from "@repo/ui/lib/lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useSendInquiryMessage } from "@/hooks/inquiries/use-send-inquiry-message";
import { api } from "@/lib/api.client";
import { InquirySidebar } from "./inquiry-sidebar";

interface InquiryDetailsProps {
	/** Inquiry ticket with messages and pre-signed attachment URLs */
	data: InquiryTicketWithMessagesAndAttachmentsResponse;
}

export function InquiryDetails({ data: initialData }: InquiryDetailsProps) {
	const router = useRouter();
	const [ticket, setTicket] =
		useState<InquiryTicketWithMessagesAndAttachmentsResponse>(initialData);

	const {
		send,
		isSending,
		error: sendError,
	} = useSendInquiryMessage({
		onSuccess: async () => {
			// Refresh the ticket to get the new message with signed attachment URLs
			const [err, refreshedTicket] = await api.inquiries.getWithMessages({
				id: ticket.id,
			});

			if (!err && refreshedTicket) {
				setTicket(refreshedTicket);
			}
		},
	});

	/* ------------------------------------------------------------------ */
	/*  Derived data                                                      */
	/* ------------------------------------------------------------------ */

	/** Total attachments across the entire conversation (for conversation-wide cap) */
	const totalAttachments = useMemo(
		() =>
			ticket.inquiryMessages.reduce(
				(count, msg) => count + (msg.attachments?.length ?? 0),
				0,
			),
		[ticket.inquiryMessages],
	);

	/**
	 * Transform messages into a flat stream of chat items.
	 * - Text messages → message bubbles
	 * - Each attachment → its own file bubble
	 */
	const chatItems: ChatItem[] = useMemo(
		() =>
			ticket.inquiryMessages.flatMap((msg) => {
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
			}),
		[ticket.inquiryMessages],
	);

	/* ------------------------------------------------------------------ */
	/*  Callback to get signed upload URLs from backend                   */
	/* ------------------------------------------------------------------ */

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

	/* ------------------------------------------------------------------ */
	/*  Send handler (wires MessageComposer → upload → API)              */
	/* ------------------------------------------------------------------ */

	const handleSend = async (
		content: string,
		fileCtx: {
			upload: () => Promise<{
				successes: { name: string; path: string }[];
				errors: { name: string; message: string }[];
			}>;
		},
	): Promise<boolean> => {
		let attachmentPaths: string[] = [];

		// Upload files first (if any)
		const uploadResult = await fileCtx.upload();
		if (uploadResult.errors.length > 0) {
			return false;
		}
		if (uploadResult.successes.length > 0) {
			attachmentPaths = uploadResult.successes.map((s) => s.path);
		}

		const { success } = await send(
			{
				ticketId: ticket.id,
				content,
				senderName: formatCitizenFullName(ticket),
				senderType: "citizen",
			},
			attachmentPaths,
		);

		return success;
	};

	const isClosed = ticket.status === "rejected" || ticket.status === "resolved";

	/* ------------------------------------------------------------------ */
	/*  Render                                                            */
	/* ------------------------------------------------------------------ */

	const lastMessageDate =
		ticket.inquiryMessages[ticket.inquiryMessages.length - 1]?.createdAt ||
		ticket.createdAt;

	return (
		<div className="container mx-auto px-6 max-w-7xl">
			{/* Back button */}
			<Button
				variant="ghost"
				className="mb-8 pl-0 hover:bg-transparent hover:text-[#a60202] text-gray-600 transition-colors"
				onClick={() => router.push("/inquiries")}
			>
				<MoveLeft className="mr-2 h-4 w-4" /> Back to Help Desk
			</Button>

			{/* Header */}
			<div className="mb-8">
				<h1 className="text-3xl sm:text-3xl md:text-4xl text-[#a60202] mb-2 font-playfair-display wrap-break-word">
					{ticket.subject}
				</h1>
				<div className="flex items-center gap-4 text-sm text-gray-500">
					<div className="flex items-center gap-1.5">
						<Ticket className="h-4 w-4 text-[#a60202]" />
						<span className="font-mono font-medium text-gray-900">
							{ticket.referenceNumber}
						</span>
					</div>
					{ticket.citizenEmail && (
						<>
							<div className="w-1 h-1 bg-gray-300 rounded-full" />
							<div className="flex items-center gap-1.5 min-w-0">
								<Mail className="h-4 w-4 shrink-0" />
								<span className="break-all min-w-0 line-clamp-2">
									{ticket.citizenEmail}
								</span>
							</div>
						</>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				{/* Main Chat Area */}
				<div className="md:col-span-2 space-y-6">
					<Card className="flex flex-col h-175 border-none shadow-md overflow-hidden bg-white border-l-4 border-l-[#a60202]">
						<CardHeader className="bg-[#a60202] text-white py-5 px-6 shrink-0 shadow-sm relative z-10">
							<div className="flex items-center justify-between">
								<div>
									<h2 className="text-xl font-playfair-display flex items-center gap-3">
										<MessageSquare className="h-5 w-5" />
										Inquiry Discussion
									</h2>
									<p className="text-white/80 text-xs mt-1 uppercase tracking-wider font-semibold">
										Ref: {ticket.referenceNumber}
									</p>
								</div>
								<div className="text-right">
									<p className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
										Last updated
									</p>
									<p className="text-sm font-medium">
										{formatDateTimeInPHT(lastMessageDate)}
									</p>
								</div>
							</div>
						</CardHeader>

						<CardContent className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-2">
							<ChatMessageList
								items={chatItems}
								isSending={isSending}
								viewerType="citizen"
							/>
						</CardContent>

						{isClosed && ticket.closureRemarks && (
							<div className="px-4 pb-2">
								<ClosureRemarks
									status={ticket.status as "resolved" | "rejected"}
									remarks={ticket.closureRemarks}
								/>
							</div>
						)}

						<MessageComposer
							isClosed={isClosed}
							closedStatus={ticket.status}
							staffName={ticket.user?.fullName ?? undefined}
							totalAttachments={totalAttachments}
							onSend={handleSend}
							isSending={isSending}
							getSignedUploadUrls={getSignedUploadUrls}
						/>
					</Card>

					{/* Send error banner */}
					{sendError && (
						<div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
							{sendError}
						</div>
					)}
				</div>

				{/* Sidebar */}
				<InquirySidebar ticket={ticket} />
			</div>
		</div>
	);
}
