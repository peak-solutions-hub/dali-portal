export interface AgendaItem {
	id: string;
	title: string;
	documentId?: string;
	description?: string;
}

export interface Document {
	id: string;
	title: string;
	type: string;
	number: string;
}

export interface Session {
	id: string;
	sessionNumber: number;
	date: string;
	time: string;
	type: "regular" | "special";
	status: "draft" | "scheduled" | "completed";
}

export interface SessionInfoBannerProps {
	session: Session;
}

export interface AgendaPanelProps {
	selectedSession: Session | null;
	agendaItems: AgendaItem[];
	onAddDocument: (itemId: string) => void;
	onSaveDraft: () => void;
	onPublish: () => void;
}

export interface DocumentsPanelProps {
	documents: Document[];
}
