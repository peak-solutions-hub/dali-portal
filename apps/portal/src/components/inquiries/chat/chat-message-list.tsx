import { useEffect, useRef } from "react";
import { ChatBubble } from "./chat-bubble";
import type { ChatItem } from "./types";

interface ChatMessageListProps {
	items: ChatItem[];
	/** Whether a message is currently being sent (shows optimistic indicator) */
	isSending?: boolean;
}

export function ChatMessageList({
	items,
	isSending = false,
}: ChatMessageListProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	// Auto-scroll the container to the bottom when items change or while sending
	useEffect(() => {
		const container = containerRef.current?.parentElement;
		if (container) {
			container.scrollTop = container.scrollHeight;
		}
	}, [items.length, isSending]);

	if (items.length === 0 && !isSending) {
		return (
			<div className="text-center py-12 text-gray-400">No messages yet.</div>
		);
	}

	return (
		<div ref={containerRef} className="flex flex-col gap-2">
			{items.map((item, index) => {
				const isFirstInGroup =
					index === 0 || items[index - 1]?.senderType !== item.senderType;

				return (
					<ChatBubble
						key={item.id}
						item={item}
						isFirstInGroup={isFirstInGroup}
					/>
				);
			})}

			{/* Optimistic sending indicator */}
			{isSending && (
				<div className="flex flex-col max-w-[85%] self-end items-end">
					<div className="p-4 rounded-2xl rounded-tr-none shadow-sm text-sm bg-[#a60202]/70 text-white/80 animate-pulse">
						Sending…
					</div>
				</div>
			)}
		</div>
	);
}
