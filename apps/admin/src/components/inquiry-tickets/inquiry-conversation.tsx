import type { InquiryTicketWithMessagesResponse } from "@repo/shared";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { createSupabaseBrowserClient } from "@repo/ui/lib/supabase/client";
import { CheckCircle, MessageSquare, Paperclip, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";

interface InquiryConversationProps {
	ticket: InquiryTicketWithMessagesResponse;
}

export function InquiryConversation({ ticket }: InquiryConversationProps) {
	const scrollRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when messages change or on mount
	useEffect(() => {
		const scrollToBottom = () => {
			if (scrollRef.current) {
				scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
			}
		};

		// Immediate scroll
		scrollToBottom();

		// Delayed scroll to ensure content is rendered
		setTimeout(scrollToBottom, 100);
	}, [ticket.inquiryMessages, ticket.inquiryMessages.length]);

	return (
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

			<style jsx>{`
				.conversation-scroll::-webkit-scrollbar {
					width: 6px;
				}
				.conversation-scroll::-webkit-scrollbar-track {
					background: transparent;
				}
				.conversation-scroll::-webkit-scrollbar-thumb {
					background-color: hsl(var(--muted-foreground) / 0.3);
					border-radius: 3px;
				}
				.conversation-scroll::-webkit-scrollbar-thumb:hover {
					background-color: hsl(var(--muted-foreground) / 0.5);
				}
			`}</style>

			<div
				ref={scrollRef}
				className="conversation-scroll space-y-3 max-h-125 overflow-y-auto pr-2"
				style={{
					scrollbarWidth: "thin",
					scrollbarColor: "hsl(var(--muted-foreground) / 0.3) transparent",
				}}
			>
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
						{msg.attachmentPaths && msg.attachmentPaths.length > 0 && (
							<div className="mt-2 space-y-2">
								{msg.attachmentPaths.map((path, i) => {
									const supabase = createSupabaseBrowserClient();
									const { data } = supabase.storage
										.from("attachments")
										.getPublicUrl(path);
									const fileName =
										path.split("/").pop() || `attachment-${i + 1}`;
									const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

									return (
										<div key={i}>
											{isImage ? (
												<a
													href={data.publicUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="block max-w-xs"
												>
													<img
														src={data.publicUrl}
														alt={fileName}
														className="rounded border border-muted hover:border-primary transition-colors max-h-60 object-cover"
													/>
												</a>
											) : (
												<a
													href={data.publicUrl}
													download={fileName}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-2 bg-muted/50 hover:bg-muted text-foreground px-3 py-2 rounded text-sm border border-muted hover:border-primary transition-colors"
												>
													<Paperclip className="h-4 w-4" />
													<span className="font-medium">{fileName}</span>
												</a>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
				))}

				{/* Closure Remarks */}
				{ticket.closureRemarks &&
					(ticket.status === "resolved" || ticket.status === "rejected") && (
						<div className="p-4 rounded-lg border-2 bg-muted/30 border-dashed">
							<div className="mb-2 flex items-center gap-2 text-xs font-semibold">
								{ticket.status === "resolved" ? (
									<CheckCircle className="h-4 w-4 text-green-600" />
								) : (
									<XCircle className="h-4 w-4 text-red-600" />
								)}
								<span
									className={
										ticket.status === "resolved"
											? "text-green-600"
											: "text-red-600"
									}
								>
									{ticket.status === "resolved"
										? "Ticket Resolved"
										: "Ticket Rejected"}
								</span>
							</div>
							<p className="text-sm text-muted-foreground leading-relaxed">
								{ticket.closureRemarks}
							</p>
						</div>
					)}
			</div>
		</div>
	);
}
