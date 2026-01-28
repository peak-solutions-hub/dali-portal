"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { RichTextEditor } from "@repo/ui/components/rich-text-editor";
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

			<RichTextEditor
				content={message}
				onChange={onMessageChange}
				placeholder="Type your message..."
				disabled={isSending}
				onKeyDown={(e) => {
					if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
						e.preventDefault();
						onSend();
					}
				}}
				className="min-h-30"
			/>
			<div className="flex justify-between items-center">
				<label
					htmlFor="admin-reply-file-upload"
					className="cursor-pointer p-2 hover:bg-muted rounded-md flex items-center justify-center text-muted-foreground transition-colors"
					title="Attach files"
				>
					<Paperclip className="h-5 w-5" />
				</label>
				<Button
					onClick={onSend}
					disabled={isSending || (!message.trim() && files.length === 0)}
					className="shrink-0 px-6"
				>
					{isSending ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin mr-2" />
							{uploadProgress > 0 ? `${uploadProgress}%` : "Sending"}
						</>
					) : (
						<>
							<Send className="h-4 w-4 mr-2" />
							Send
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
