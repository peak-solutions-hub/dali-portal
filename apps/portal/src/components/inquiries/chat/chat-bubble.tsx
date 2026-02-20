import { Download, FileIcon, Shield } from "@repo/ui/lib/lucide-react";
import type { ChatItem } from "./types";

interface ChatBubbleProps {
	item: ChatItem;
	/** Whether this bubble is the first in a consecutive group from the same sender */
	isFirstInGroup: boolean;
}

function formatTimestamp(iso: string) {
	return new Date(iso).toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}

export function ChatBubble({ item, isFirstInGroup }: ChatBubbleProps) {
	const isCitizen = item.senderType === "citizen";

	return (
		<div
			className={`flex flex-col max-w-[85%] ${isCitizen ? "self-end items-end" : "self-start items-start"}`}
		>
			{/* Sender header — only for the first item in a group */}
			{isFirstInGroup && (
				<div className="flex items-center gap-2 mb-1 px-1 mt-2">
					{isCitizen ? (
						<span className="text-xs text-gray-500">
							{formatTimestamp(item.createdAt)}
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
			)}

			{item.type === "message" ? (
				<MessageBubble content={item.content} isCitizen={isCitizen} />
			) : (
				<AttachmentBubble
					fileName={item.fileName}
					signedUrl={item.signedUrl}
					isCitizen={isCitizen}
				/>
			)}

			{/* Staff timestamp at the bottom */}
			{!isCitizen && isFirstInGroup && (
				<span className="text-xs text-gray-400 mt-1 ml-1">
					{formatTimestamp(item.createdAt)}
				</span>
			)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function MessageBubble({
	content,
	isCitizen,
}: {
	content: string;
	isCitizen: boolean;
}) {
	return (
		<div
			className={`p-4 rounded-2xl shadow-sm text-sm whitespace-pre-wrap ${
				isCitizen
					? "bg-[#a60202] text-white rounded-tr-none"
					: "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
			}`}
		>
			{content}
		</div>
	);
}

function AttachmentBubble({
	fileName,
	signedUrl,
	isCitizen,
}: {
	fileName: string;
	signedUrl: string | null;
	isCitizen: boolean;
}) {
	return (
		<a
			href={signedUrl || "#"}
			target="_blank"
			rel="noopener noreferrer"
			className={`flex items-center gap-3 p-3 rounded-2xl shadow-sm transition-all ${
				isCitizen
					? "bg-[#8b0202] hover:bg-[#7a0202] text-white rounded-tr-none"
					: "bg-white hover:bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none"
			} ${!signedUrl ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
			onClick={signedUrl ? undefined : (e) => e.preventDefault()}
			title={signedUrl ? `Download ${fileName}` : "Download unavailable"}
		>
			<div
				className={`p-2 rounded-lg ${isCitizen ? "bg-white/20" : "bg-gray-100"}`}
			>
				<FileIcon
					className={`h-5 w-5 ${isCitizen ? "text-white" : "text-gray-600"}`}
				/>
			</div>
			<div className="flex flex-col min-w-0 flex-1">
				<span
					className={`text-sm font-medium truncate max-w-48 ${isCitizen ? "text-white" : "text-gray-900"}`}
				>
					{fileName}
				</span>
				<span
					className={`text-xs ${isCitizen ? "text-white/70" : "text-gray-500"}`}
				>
					{signedUrl ? "Click to view" : "Unavailable"}
				</span>
			</div>
			<Download
				className={`h-4 w-4 shrink-0 ${isCitizen ? "text-white/80" : "text-gray-400"}`}
			/>
		</a>
	);
}
