"use client";

import { isDefinedError } from "@orpc/client";
import type {
	InquiryStatus,
	InquiryTicketWithMessagesResponse,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RichTextEditor } from "@repo/ui/components/rich-text-editor";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Separator } from "@repo/ui/components/separator";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@repo/ui/components/sheet";
import {
	Calendar,
	CheckCircle,
	ChevronLeft,
	Loader2,
	Mail,
	MessageSquare,
	Phone,
	Send,
	Tag,
	User,
	UserPlus,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api.client";
import { formatInquiryCategory } from "@/utils/inquiry-helpers";
import { createTicketHelpers } from "@/utils/inquiry-ticket-helpers";
import { InquiryStatusBadge } from "./inquiry-status-badge";

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

	const helpers = createTicketHelpers(ticketId, message, {
		onTicketUpdate: setTicket,
		onMessageClear: () => setMessage(""),
		onLoadingChange: setIsSending,
		onStatusLoadingChange: setIsUpdatingStatus,
	});

	const { handleSendMessage, handleAssignToMe, handleResolve, handleReject } =
		helpers;

	return (
		<Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<SheetContent className="w-full sm:max-w-lg p-0 overflow-y-auto">
				<SheetTitle className="sr-only">Inquiry Ticket</SheetTitle>
				<div className="flex h-full flex-col">
					{!isLoading && !error && ticket && (
						<>
							{/* Header Container */}
							<div className="border-b bg-muted/30 p-4">
								<div className="flex items-start gap-4">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-3 py-2">
											<h1 className="text-xl font-semibold leading-tight">
												{ticket.subject}
											</h1>
											<InquiryStatusBadge status={ticket.status} />
										</div>
										<p className="mt-1 text-xs text-muted-foreground">
											{ticket.referenceNumber}
										</p>
									</div>
								</div>
							</div>

							{/* Scrollable Content */}
							<ScrollArea className="flex-1">
								<div className="space-y-6 p-6">
									{/* Citizen Information */}
									<div className="space-y-3">
										<h3 className="font-semibold">Citizen Information</h3>
										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-1">
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<User className="h-3 w-3" />
													Name
												</div>
												<p className="text-sm">{ticket.citizenName}</p>
											</div>
											<div className="space-y-1">
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<Mail className="h-3 w-3" />
													Email
												</div>
												<p className="text-sm">{ticket.citizenEmail}</p>
											</div>
											<div className="space-y-1">
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<Calendar className="h-3 w-3" />
													Date Submitted
												</div>
												<p className="text-sm">
													{new Date(ticket.createdAt).toLocaleString("en-US", {
														month: "short",
														day: "numeric",
														year: "numeric",
														hour: "numeric",
														minute: "2-digit",
														hour12: true,
													})}
												</p>
											</div>
											<div className="space-y-1">
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<Tag className="h-3 w-3" />
													Request Type
												</div>
												<p className="text-sm">
													{formatInquiryCategory(ticket.category)}
												</p>
											</div>
										</div>
									</div>

									<Separator />

									{/* Conversation History */}
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<MessageSquare className="h-4 w-4" />
												<h3 className="font-semibold">Conversation History</h3>
											</div>
											<span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
												{ticket.inquiryMessages.length} message
												{ticket.inquiryMessages.length !== 1 && "s"}
											</span>
										</div>

										<div className="space-y-3">
											{ticket.inquiryMessages.map((msg) => (
												<div
													key={msg.id}
													className={`max-w-[80%] rounded-lg p-3 ${
														msg.senderType === "citizen"
															? "bg-muted/30 border border-muted"
															: "ml-auto bg-primary/5 border border-primary/20"
													}`}
												>
													<div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
														<span className="font-medium text-foreground">
															{msg.senderName}
														</span>
														<span className="text-muted-foreground/60">•</span>
														<span>
															{new Date(msg.createdAt).toLocaleString("en-US", {
																month: "short",
																day: "numeric",
																year: "numeric",
																hour: "numeric",
																minute: "2-digit",
																hour12: true,
															})}
														</span>
													</div>
													<div
														className="text-sm leading-relaxed prose prose-sm max-w-none break-all overflow-hidden"
														style={{
															wordBreak: "break-word",
															overflowWrap: "break-word",
														}}
														dangerouslySetInnerHTML={{ __html: msg.content }}
													/>
												</div>
											))}
										</div>
									</div>
								</div>
							</ScrollArea>

							{/* Footer Actions */}
							<div className="border-t bg-background p-6">
								{/* Send Message */}
								<div className="space-y-3">
									{/* <Label htmlFor="message" className="text-sm font-medium">Send Message to Citizen</Label> */}
									<div className="space-y-2">
										<RichTextEditor
											content={message}
											onChange={setMessage}
											placeholder="Type your message..."
											disabled={isSending}
											onKeyDown={(e) => {
												if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
													e.preventDefault();
													handleSendMessage();
												}
											}}
											className="min-h-30"
										/>
										<div className="flex justify-end items-center">
											<Button
												onClick={handleSendMessage}
												disabled={!message.trim() || isSending}
												className="shrink-0 px-6"
											>
												{isSending ? (
													<Loader2 className="h-4 w-4 animate-spin mr-2" />
												) : (
													<Send className="h-4 w-4 mr-2" />
												)}
												Send
											</Button>
										</div>
									</div>
								</div>

								{/* Ticket Actions */}
								<div className="space-y-3 mt-6">
									<p className="text-sm font-medium text-muted-foreground">
										Actions
									</p>
									<div className="grid grid-cols-3 gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={handleAssignToMe}
											disabled={isUpdatingStatus}
											className="flex items-center justify-center gap-2"
										>
											<UserPlus className="h-4 w-4" />
											Assign to Me
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={handleResolve}
											disabled={isUpdatingStatus}
											className="flex items-center justify-center gap-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700"
										>
											<CheckCircle className="h-4 w-4" />
											Resolve
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={handleReject}
											disabled={isUpdatingStatus}
											className="flex items-center justify-center gap-2 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700"
										>
											<XCircle className="h-4 w-4" />
											Reject
										</Button>
									</div>
								</div>
							</div>
						</>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
