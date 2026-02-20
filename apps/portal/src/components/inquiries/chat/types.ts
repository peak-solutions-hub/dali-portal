/**
 * Shared types for the inquiry chat UI.
 */

export type ChatMessageItem = {
	type: "message";
	id: string;
	content: string;
	senderType: string;
	createdAt: string;
};

export type ChatAttachmentItem = {
	type: "attachment";
	id: string;
	fileName: string;
	signedUrl: string | null;
	path: string;
	senderType: string;
	createdAt: string;
};

export type ChatItem = ChatMessageItem | ChatAttachmentItem;
