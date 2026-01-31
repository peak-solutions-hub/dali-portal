"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	FILE_UPLOAD_PRESETS,
	InquiryStatus,
	type InquiryTicketWithMessagesAndAttachmentsResponse,
	type SendInquiryMessageInput,
	SendInquiryMessageSchema,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader } from "@repo/ui/components/card";
import { formatBytes } from "@repo/ui/components/dropzone";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@repo/ui/components/form";
import { Textarea } from "@repo/ui/components/textarea";
import { useSupabaseUpload } from "@repo/ui/hooks/use-supabase-upload";
import {
	CheckCircle2,
	Clock,
	Download,
	FileIcon,
	Mail,
	MessageSquare,
	MoveLeft,
	Paperclip,
	Send,
	Shield,
	Ticket,
	User,
	X,
} from "@repo/ui/lib/lucide-react";
import { createSupabaseBrowserClient } from "@repo/ui/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSendInquiryMessage } from "@/hooks/use-send-inquiry-message";

interface InquiryDetailsProps {
	/** Inquiry ticket with messages and pre-signed attachment URLs from the backend */
	data: InquiryTicketWithMessagesAndAttachmentsResponse;
}

const { maxFiles, maxFileSize, allowedMimeTypes } =
	FILE_UPLOAD_PRESETS.ATTACHMENTS;

export function InquiryDetails({ data: initialData }: InquiryDetailsProps) {
	const router = useRouter();
	const [ticket, setTicket] =
		useState<InquiryTicketWithMessagesAndAttachmentsResponse>(initialData);

	// Use the send inquiry message hook for API logic
	const {
		send,
		isSending,
		error: sendError,
	} = useSendInquiryMessage({
		onSuccess: (message) => {
			// Add the new message to the local state with empty attachments array
			// (newly sent messages won't have signed URLs until page refresh)
			setTicket((prev) => ({
				...prev,
				inquiryMessages: [
					...prev.inquiryMessages,
					{ ...message, attachments: [] },
				],
			}));
			messageForm.reset();
			// Note: setFiles will be called after upload succeeds
		},
	});

	// State for upload errors
	const [uploadError, setUploadError] = useState<string | null>(null);

	const messageForm = useForm<Pick<SendInquiryMessageInput, "content">>({
		resolver: zodResolver(SendInquiryMessageSchema.pick({ content: true })),
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: {
			content: "",
		},
	});

	const supabase = createSupabaseBrowserClient();

	// File upload hook with Supabase integration
	const {
		files,
		setFiles,
		getRootProps,
		getInputProps,
		isDragActive,
		onUpload,
		hasFileErrors,
		isMaxFilesReached,
	} = useSupabaseUpload({
		supabaseClient: supabase,
		bucketName: "attachments",
		path: "inquiries/replies",
		maxFiles,
		maxFileSize,
		allowedMimeTypes: [...allowedMimeTypes],
	});

	// Sort messages by date (oldest first for chat flow)
	const sortedMessages = [...ticket.inquiryMessages].sort(
		(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
	);

	const removeFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSendMessage = async () => {
		const content = messageForm.getValues("content");
		if ((!content.trim() && files.length === 0) || isSending) return;

		// Clear previous errors
		setUploadError(null);

		// Can't send if all files have errors
		if (
			files.length > 0 &&
			hasFileErrors &&
			files.every((f) => f.errors.length > 0)
		) {
			setUploadError("Please fix file errors before sending.");
			return;
		}

		// Trigger validation
		const isValid = await messageForm.trigger("content");
		if (!isValid && content.trim()) return;

		let attachmentPaths: string[] = [];

		// Upload files if any valid ones exist
		const validFiles = files.filter((f) => f.errors.length === 0);
		if (validFiles.length > 0) {
			const uploadResult = await onUpload();
			if (uploadResult.errors.length > 0) {
				setUploadError("Failed to upload some files. Please try again.");
				return; // Upload failed, don't send message
			}
			if (uploadResult.successes.length > 0) {
				attachmentPaths = uploadResult.successes.map((s) => s.path);
			}
		}

		// Send the message via hook
		const { success } = await send(
			{
				ticketId: ticket.id,
				content: content.trim() || "(Attachment)",
				senderName: ticket.citizenName,
				senderType: "citizen",
			},
			attachmentPaths,
		);

		if (success) {
			setFiles([]);
		}
	};

	const getStatusBadge = (status: InquiryStatus) => {
		switch (status) {
			case "new":
				return (
					<span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium border border-blue-200">
						New
					</span>
				);
			case "open":
				return (
					<span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium border border-yellow-200">
						Opens
					</span>
				);
			case "resolved":
				return (
					<span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium border border-green-200">
						Resolved
					</span>
				);
			case "rejected":
				return (
					<span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium border border-gray-200">
						Rejected
					</span>
				);
			default:
				return (
					<span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border">
						{status}
					</span>
				);
		}
	};

	const getCategoryLabel = (category: string) => {
		return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
	};

	return (
		<div className="container mx-auto px-6 max-w-7xl">
			<Button
				variant="ghost"
				className="mb-8 pl-0 hover:bg-transparent hover:text-[#a60202] text-gray-600 transition-colors"
				onClick={() => router.push("/inquiries")}
			>
				<MoveLeft className="mr-2 h-4 w-4" /> Back to Help Desk
			</Button>

			<div className="mb-8">
				<h1 className="text-3xl sm:text-3xl md:text-4xl text-[#a60202] mb-2 font-playfair-display">
					{ticket.subject}
				</h1>
				<div className="flex items-center gap-4 text-sm text-gray-500">
					<div className="flex items-center gap-1.5">
						<Ticket className="h-4 w-4 text-[#a60202]" />
						<span className="font-mono font-medium text-gray-900">
							{ticket.referenceNumber}
						</span>
					</div>
					<div className="w-1 h-1 bg-gray-300 rounded-full" />
					<div className="flex items-center gap-1.5">
						<Mail className="h-4 w-4" />
						<span>{ticket.citizenEmail}</span>
					</div>
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
										{new Date(
											ticket.inquiryMessages[ticket.inquiryMessages.length - 1]
												?.createdAt || ticket.createdAt,
										).toLocaleString("en-US", {
											month: "short",
											day: "numeric",
											hour: "numeric",
											minute: "2-digit",
											hour12: true,
										})}
									</p>
								</div>
							</div>
						</CardHeader>

						<CardContent className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
							{sortedMessages.length === 0 && (
								<div className="text-center py-12 text-gray-400">
									No messages yet.
								</div>
							)}

							{sortedMessages.map((msg) => {
								const isCitizen = msg.senderType === "citizen";
								return (
									<div
										key={msg.id}
										className={`flex flex-col max-w-[85%] ${isCitizen ? "self-end items-end" : "self-start items-start"}`}
									>
										<div className="flex items-center gap-2 mb-1 px-1">
											{isCitizen ? (
												<span className="text-xs text-gray-500">
													{new Date(msg.createdAt).toLocaleString("en-US", {
														month: "short",
														day: "numeric",
														hour: "numeric",
														minute: "2-digit",
														hour12: true,
													})}
												</span>
											) : (
												<>
													<Shield className="h-3 w-3 text-[#a60202]" />
													<span className="text-xs font-semibold text-[#a60202]">
														Staff Response
													</span>
												</>
											)}
										</div>

										<div
											className={`p-4 rounded-2xl shadow-sm text-sm whitespace-pre-wrap ${
												isCitizen
													? "bg-[#a60202] text-white rounded-tr-none"
													: "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
											}`}
										>
											{msg.content}
										</div>

										{/* Display attachments with signed URLs from backend */}
										{msg.attachments && msg.attachments.length > 0 && (
											<div
												className={`mt-2 flex flex-wrap gap-2 ${isCitizen ? "justify-end" : "justify-start"}`}
											>
												{msg.attachments.map((attachment) => (
													<a
														key={attachment.path}
														href={attachment.signedUrl || "#"}
														target="_blank"
														rel="noopener noreferrer"
														className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
															attachment.signedUrl
																? isCitizen
																	? "bg-white/20 text-white hover:bg-white/30"
																	: "bg-gray-100 text-gray-700 hover:bg-gray-200"
																: "bg-gray-100 text-gray-400 cursor-not-allowed"
														}`}
														onClick={
															attachment.signedUrl
																? undefined
																: (e) => e.preventDefault()
														}
														title={
															attachment.signedUrl
																? `Download ${attachment.fileName}`
																: "Download unavailable"
														}
													>
														<Download className="h-3 w-3" />
														<span className="max-w-24 truncate">
															{attachment.fileName}
														</span>
													</a>
												))}
											</div>
										)}

										{!isCitizen && (
											<span className="text-xs text-gray-400 mt-1 ml-1">
												{new Date(msg.createdAt).toLocaleString("en-US", {
													month: "short",
													day: "numeric",
													hour: "numeric",
													minute: "2-digit",
													hour12: true,
												})}
											</span>
										)}
									</div>
								);
							})}
						</CardContent>

						{/* Reply Box */}
						{ticket.status === "rejected" || ticket.status === "resolved" ? (
							<div className="p-4 bg-gray-100 border-t text-center text-gray-500 text-sm">
								This ticket has been marked as <strong>{ticket.status}</strong>.
								You cannot send new messages.
							</div>
						) : (
							<div className="p-4 bg-white border-t space-y-3">
								{/* Error display */}
								{(sendError || uploadError) && (
									<div className="bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
										<X className="w-3 h-3" />
										{sendError || uploadError}
									</div>
								)}
								{/* Max files warning */}
								{isMaxFilesReached && (
									<div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg text-xs">
										Maximum {maxFiles} files. Remove one to add more.
									</div>
								)}
								<Form {...messageForm}>
									{/* File list */}
									{files.length > 0 && (
										<div className="flex gap-2 flex-wrap">
											{files.map((f, i) => (
												<div
													key={`${f.name}-${i}`}
													className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs border ${
														f.errors && f.errors.length > 0
															? "bg-red-50 border-red-200"
															: "bg-gray-100 border-gray-200"
													}`}
												>
													<FileIcon
														className={`h-3 w-3 ${f.errors && f.errors.length > 0 ? "text-red-500" : "text-gray-500"}`}
													/>
													<span className="truncate max-w-40">{f.name}</span>
													<span className="text-gray-400">
														{formatBytes(f.size, 1)}
													</span>
													{f.errors && f.errors.length > 0 && (
														<span
															className="text-destructive text-[10px]"
															title={f.errors[0]?.message}
														>
															!
														</span>
													)}
													<button
														type="button"
														onClick={() => removeFile(i)}
														className="text-gray-400 hover:text-red-500"
													>
														<X className="h-3 w-3" />
													</button>
												</div>
											))}
										</div>
									)}
									{/* Drop zone indicator */}
									{isDragActive && (
										<div className="border-2 border-dashed border-primary bg-primary/10 rounded-lg p-3 text-center text-sm text-primary">
											Drop files here...
										</div>
									)}
									<div className="flex gap-3" {...getRootProps()}>
										<input {...getInputProps()} disabled={isMaxFilesReached} />
										<div className="relative pt-2">
											<button
												type="button"
												className={`cursor-pointer p-2 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors ${
													isMaxFilesReached
														? "text-gray-300 cursor-not-allowed"
														: "text-gray-500"
												}`}
												title={
													isMaxFilesReached
														? `Maximum ${maxFiles} files reached`
														: `Attach files (max ${maxFiles}, ${formatBytes(maxFileSize)} each)`
												}
												disabled={isMaxFilesReached}
											>
												<Paperclip className="h-5 w-5" />
											</button>
										</div>
										<FormField
											control={messageForm.control}
											name="content"
											render={({ field }) => (
												<FormItem className="flex-1">
													<FormControl>
														<Textarea
															{...field}
															placeholder="Type your reply here..."
															className="min-h-12.5 max-h-37.5 bg-gray-50 border-gray-200 focus:bg-white resize-y"
															onKeyDown={(e) => {
																if (e.key === "Enter" && !e.shiftKey) {
																	e.preventDefault();
																	handleSendMessage();
																}
															}}
															onClick={(e) => e.stopPropagation()}
														/>
													</FormControl>
													<FormMessage className="text-xs mt-1" />
												</FormItem>
											)}
										/>
										<Button
											type="button"
											className="bg-[#a60202] hover:bg-[#8b0202] h-auto px-4"
											disabled={
												isSending ||
												(!messageForm.getValues("content").trim() &&
													files.length === 0)
											}
											onClick={(e) => {
												e.stopPropagation();
												handleSendMessage();
											}}
										>
											{isSending ? (
												<span className="text-xs">Sending...</span>
											) : (
												<Send className="h-4 w-4" />
											)}
										</Button>
									</div>{" "}
								</Form>{" "}
							</div>
						)}
					</Card>
				</div>

				{/* Sidebar Info */}
				<div className="space-y-6">
					<Card className="border-none shadow-md bg-white border-l-4 border-l-[#a60202]">
						<CardContent className="p-6 text-gray-900">
							<h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 pb-2 border-b border-gray-100">
								Ticket Details
							</h3>

							<div className="space-y-6">
								<div>
									<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
										Status
									</p>
									<div className="mt-1">{getStatusBadge(ticket.status)}</div>
								</div>

								<div>
									<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
										Category
									</p>
									<p className="text-sm font-medium">
										{getCategoryLabel(ticket.category)}
									</p>
								</div>

								<div>
									<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
										Date Created
									</p>
									<div className="flex items-center gap-2 mt-1 text-sm font-medium">
										<Clock className="h-3 w-3 text-[#a60202]" />
										{new Date(ticket.createdAt).toLocaleDateString("en-US", {
											month: "long",
											day: "numeric",
											year: "numeric",
										})}
									</div>
								</div>

								<div className="pt-6 border-t border-gray-100">
									<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-3">
										Your Information
									</p>
									<div className="space-y-2">
										<div className="flex items-center gap-2 text-sm font-medium">
											<div className="bg-gray-100 p-1.5 rounded-full">
												<User className="h-3 w-3 text-gray-600" />
											</div>
											{ticket.citizenName}
										</div>
										<div className="flex items-center gap-2 text-sm font-medium">
											<div className="bg-gray-100 p-1.5 rounded-full">
												<Mail className="h-3 w-3 text-gray-600" />
											</div>
											{ticket.citizenEmail}
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{ticket.status === "resolved" && ticket.closureRemarks && (
						<Card className="border-green-200 bg-green-50 shadow-sm">
							<CardContent className="p-4">
								<div className="flex items-start gap-3">
									<CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
									<div>
										<p className="font-semibold text-green-800 text-sm">
											Resolution Remarks
										</p>
										<p className="text-sm text-green-700 mt-1">
											{ticket.closureRemarks}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
