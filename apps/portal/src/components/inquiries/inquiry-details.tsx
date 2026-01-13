"use client";

import { isDefinedError } from "@orpc/client";
import {
	InquiryStatus,
	type InquiryTicketWithMessagesResponse,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import {
	CheckCircle2,
	Clock,
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
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api.client";

interface InquiryDetailsProps {
	data: InquiryTicketWithMessagesResponse;
}

export function InquiryDetails({ data: initialData }: InquiryDetailsProps) {
	const router = useRouter();
	const [ticket, setTicket] =
		useState<InquiryTicketWithMessagesResponse>(initialData);
	const [newMessage, setNewMessage] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const [uploadProgress, setUploadProgress] = useState(0);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Sort messages by date (oldest first for chat flow)
	const sortedMessages = [...ticket.inquiryMessages].sort(
		(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
	);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [sortedMessages]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const newFiles = Array.from(e.target.files);
			// Limit to 3 files, 10MB each for replies (simpler limits)
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

		const supabase = createSupabaseBrowserClient();
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

	const handleSendMessage = async () => {
		if ((!newMessage.trim() && files.length === 0) || isSending) return;

		setIsSending(true);
		setUploadProgress(10);

		try {
			let attachmentPaths: string[] = [];
			if (files.length > 0) {
				setUploadProgress(40);
				attachmentPaths = await uploadFiles();
				setUploadProgress(80);
			}

			const [err, response] = await api.inquiries.sendMessage({
				ticketId: ticket.id,
				content: newMessage.trim() || "(Attachment)",
				senderName: ticket.citizenName, // Citizen is replying
				senderType: "citizen",
				attachmentPaths:
					attachmentPaths.length > 0 ? attachmentPaths : undefined,
			});

			if (err) {
				alert(isDefinedError(err) ? err.message : "Failed to send message");
				return;
			}

			if (response) {
				// Add the new message to the local state (response already has ISO string date)
				setTicket((prev) => ({
					...prev,
					inquiryMessages: [...prev.inquiryMessages, response],
				}));

				setNewMessage("");
				setFiles([]);
			}
		} catch (e) {
			console.error(e);
			alert("An error occurred.");
		} finally {
			setIsSending(false);
			setUploadProgress(0);
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
					<Card className="flex flex-col h-[700px] border-none shadow-md overflow-hidden bg-white border-l-4 border-l-[#a60202]">
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

										{msg.attachmentPaths && msg.attachmentPaths.length > 0 && (
											<div className="mt-2 flex flex-wrap gap-2 justify-end">
												{msg.attachmentPaths.map((path, i) => (
													<span
														key={i}
														className="inline-flex items-center gap-1 bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs"
													>
														<Paperclip className="h-3 w-3" />
														Attachment {i + 1}
													</span>
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
							<div ref={messagesEndRef} />
						</CardContent>

						{/* Reply Box */}
						{ticket.status === "rejected" || ticket.status === "resolved" ? (
							<div className="p-4 bg-gray-100 border-t text-center text-gray-500 text-sm">
								This ticket has been marked as <strong>{ticket.status}</strong>.
								You cannot send new messages.
							</div>
						) : (
							<div className="p-4 bg-white border-t space-y-3">
								{files.length > 0 && (
									<div className="flex gap-2 mb-2 flex-wrap">
										{files.map((f, i) => (
											<div
												key={i}
												className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-xs border border-gray-200"
											>
												<span className="truncate max-w-[150px]">{f.name}</span>
												<button
													onClick={() => removeFile(i)}
													className="text-gray-400 hover:text-red-500"
												>
													<X className="h-3 w-3" />
												</button>
											</div>
										))}
									</div>
								)}
								<div className="flex gap-3">
									<div className="relative pt-2">
										<Input
											type="file"
											multiple
											className="hidden"
											id="reply-file-upload"
											onChange={handleFileChange}
										/>
										<label
											htmlFor="reply-file-upload"
											className="cursor-pointer p-2 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-500 transition-colors"
											title="Attach files"
										>
											<Paperclip className="h-5 w-5" />
										</label>
									</div>
									<Textarea
										value={newMessage}
										onChange={(e) => setNewMessage(e.target.value)}
										placeholder="Type your reply here..."
										className="min-h-[50px] max-h-[150px] bg-gray-50 border-gray-200 focus:bg-white resize-y"
										onKeyDown={(e) => {
											if (e.key === "Enter" && !e.shiftKey) {
												e.preventDefault();
												handleSendMessage();
											}
										}}
									/>
									<Button
										className="bg-[#a60202] hover:bg-[#8b0202] h-auto px-4"
										disabled={
											isSending || (!newMessage.trim() && files.length === 0)
										}
										onClick={handleSendMessage}
									>
										{isSending ? (
											<span className="text-xs">
												{uploadProgress > 0 ? `${uploadProgress}%` : "..."}
											</span>
										) : (
											<Send className="h-4 w-4" />
										)}
									</Button>
								</div>
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
