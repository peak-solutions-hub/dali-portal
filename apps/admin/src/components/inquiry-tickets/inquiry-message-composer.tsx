"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Loader2, Paperclip, Send, X } from "lucide-react";

interface InquiryMessageComposerProps {
	message: string;
	onMessageChange: (message: string) => void;
	files: File[];
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onRemoveFile: (index: number) => void;
	onSend: () => void;
	isSending: boolean;
	uploadProgress: number;
	disabled?: boolean;
}

export function InquiryMessageComposer({
	message,
	onMessageChange,
	files,
	onFileChange,
	onRemoveFile,
	onSend,
	isSending,
	uploadProgress,
	disabled = false,
}: InquiryMessageComposerProps) {
	return (
		<div className="space-y-2">
			{/* File upload input (hidden) */}
			<Input
				type="file"
				multiple
				className="hidden"
				id="admin-reply-file-upload"
				onChange={onFileChange}
				disabled={disabled}
			/>

			{/* File preview section */}
			{files.length > 0 && (
				<div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded border">
					{files.map((file, i) => (
						<div
							key={i}
							className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-md text-sm"
						>
							<Paperclip className="h-3 w-3 text-muted-foreground" />
							<span className="text-xs font-medium max-w-37.5 truncate">
								{file.name}
							</span>
							<button
								type="button"
								onClick={() => onRemoveFile(i)}
								className="text-muted-foreground hover:text-destructive"
							>
								<X className="h-3 w-3" />
							</button>
						</div>
					))}
				</div>
			)}

			{/* Input row with attachment, textarea, and send button */}
			<div className="flex items-center gap-2">
				{/* Attachment button */}
				<label
					htmlFor="admin-reply-file-upload"
					className={
						disabled
							? "h-12.5 p-2 rounded-md flex items-center justify-center text-muted-foreground/30 cursor-not-allowed"
							: "h-12.5 cursor-pointer p-2 hover:bg-muted rounded-md flex items-center justify-center text-muted-foreground transition-colors"
					}
					title={
						disabled ? "Assign the ticket to attach files" : "Attach files"
					}
					style={disabled ? { pointerEvents: "none" } : {}}
				>
					<Paperclip className="h-5 w-5" />
				</label>

				{/* Textarea */}
				<Textarea
					value={message}
					onChange={(e) => onMessageChange(e.target.value)}
					placeholder={
						disabled ? "Assign the ticket to reply..." : "Type your message..."
					}
					disabled={isSending || disabled}
					onKeyDown={(e) => {
						if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
							e.preventDefault();
							onSend();
						}
					}}
					className="min-h-12.5 max-h-37.5 border-gray-300 resize-y flex-1"
				/>

				{/* Send button */}
				<Button
					onClick={onSend}
					disabled={
						isSending || (!message.trim() && files.length === 0) || disabled
					}
					className="h-12.5 px-4 shrink-0"
				>
					{isSending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Send className="h-4 w-4" />
					)}
				</Button>
			</div>
		</div>
	);
}
