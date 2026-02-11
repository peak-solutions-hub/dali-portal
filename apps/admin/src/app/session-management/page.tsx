"use client";

import type { SessionManagementSession as SessionUI } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Plus } from "@repo/ui/lib/lucide-react";
import {
	getSectionLabel,
	getSectionLetter,
	SESSION_SECTION_ORDER,
} from "@repo/ui/lib/session-ui";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AgendaPanel,
	CreateSessionDialog,
	DocumentsPanel,
	DocumentViewerDialog,
	PresentationMode,
} from "@/components/session-management";
import type { AttachedDocument } from "@/components/session-management/agenda-panel";
import { api } from "@/lib/api.client";

// Dynamically generate agenda items from the session section enum
// Each section gets an uppercase alphabetical letter (A, B, C, ...)
const DEFAULT_AGENDA_ITEMS = SESSION_SECTION_ORDER.map((section, index) => ({
	id: section,
	title: `${getSectionLetter(section)}. ${getSectionLabel(section)
		.replace(/\s+of:$/, "")
		.replace(/:$/, "")}`,
	section,
	orderIndex: index,
}));

/**
 * Transform API session to the shape the UI components expect
 */
function toSessionUI(session: {
	id: string;
	sessionNumber: number;
	scheduleDate: string | Date;
	type: string;
	status: string;
}): SessionUI {
	const d = new Date(session.scheduleDate);
	return {
		id: session.id,
		sessionNumber: session.sessionNumber,
		date: d.toISOString().split("T")[0] ?? "",
		time: d.toLocaleTimeString("en-GB", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
			timeZone: "Asia/Manila",
		}),
		type: session.type as "regular" | "special",
		status: session.status as "draft" | "scheduled" | "completed",
	};
}

export default function SessionManagement() {
	return <AgendaBuilderPage />;
}

function AgendaBuilderPage() {
	const [sessions, setSessions] = useState<SessionUI[]>([]);
	const [selectedSession, setSelectedSession] = useState<string | null>(null);
	const [documents, setDocuments] = useState<
		{
			id: string;
			title: string;
			type: string;
			number: string;
			classification: string;
			status: string;
			purpose: string;
			receivedAt: string;
			authors: string[];
			sponsors: string[];
		}[]
	>([]);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showPresentationMode, setShowPresentationMode] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [actionInFlight, setActionInFlight] = useState<string | null>(null);
	const [contentTextMap, setContentTextMap] = useState<Record<string, string>>(
		{},
	);
	const [documentsByAgendaItem, setDocumentsByAgendaItem] = useState<
		Record<string, AttachedDocument[]>
	>({});
	const [viewerDocumentId, setViewerDocumentId] = useState<string | null>(null);
	const [pendingSaveForScheduled, setPendingSaveForScheduled] = useState(false);

	/** Find a document by ID from the approved documents list */
	const viewerDocument =
		documents.find((d) => d.id === viewerDocumentId) ?? null;

	const handleContentTextChange = useCallback(
		(itemId: string, text: string) => {
			setContentTextMap((prev) => ({ ...prev, [itemId]: text }));
		},
		[],
	);

	/** Wrapper that flags a pending save when docs change on a scheduled session */
	const handleDocumentsChange = useCallback(
		(docs: Record<string, AttachedDocument[]>) => {
			setDocumentsByAgendaItem(docs);
			const session = sessions.find((s) => s.id === selectedSession);
			if (session?.status === "scheduled") {
				setPendingSaveForScheduled(true);
			}
		},
		[sessions, selectedSession],
	);

	const fetchSessions = useCallback(async () => {
		const [err, data] = await api.sessions.adminList({
			limit: 100,
			sortDirection: "desc",
		});

		if (!err && data) {
			setSessions(data.sessions.map(toSessionUI));
		}
	}, []);

	const fetchDocuments = useCallback(async () => {
		const [err, data] = await api.sessions.approvedDocuments({});
		if (!err && data) {
			setDocuments(data.documents);
		}
	}, []);

	useEffect(() => {
		Promise.all([fetchSessions(), fetchDocuments()]).finally(() =>
			setIsLoading(false),
		);
	}, [fetchSessions, fetchDocuments]);

	const handleSessionChange = async (sessionId: string) => {
		setSelectedSession(sessionId);
		// Reset state
		setContentTextMap({});
		setDocumentsByAgendaItem({});

		// Load saved agenda items from the API
		const [err, data] = await api.sessions.adminGetById({ id: sessionId });
		if (!err && data && data.agendaItems.length > 0) {
			const newContentTextMap: Record<string, string> = {};
			const newDocsByAgenda: Record<string, AttachedDocument[]> = {};

			for (const agendaItem of data.agendaItems) {
				const sectionKey = agendaItem.section;

				if (agendaItem.document) {
					// Document sub-item
					const docs = newDocsByAgenda[sectionKey] || [];
					docs.push({
						id: agendaItem.document.id,
						key: agendaItem.document.codeNumber,
						title: agendaItem.document.title,
						summary: agendaItem.contentText ?? undefined,
						classification: agendaItem.document.classification ?? undefined,
					});
					newDocsByAgenda[sectionKey] = docs;
				} else if (agendaItem.contentText) {
					// Section-level text (e.g. minutes)
					newContentTextMap[sectionKey] = agendaItem.contentText;
				}
			}

			setContentTextMap(newContentTextMap);
			setDocumentsByAgendaItem(newDocsByAgenda);
		}
	};

	const handleAddDocument = (agendaItemId: string) => {
		console.log("Add document to agenda item:", agendaItemId);
	};

	const buildAgendaItems = useCallback(() => {
		const agendaItems: {
			section: string;
			orderIndex: number;
			contentText?: string | null;
			linkedDocument?: string | null;
		}[] = [];

		let orderIdx = 0;
		for (const item of DEFAULT_AGENDA_ITEMS) {
			const sectionDocs = documentsByAgendaItem[item.id] || [];
			const sectionContentText = contentTextMap[item.id] || null;

			if (sectionDocs.length === 0) {
				// No attached documents — just save the section with its contentText
				agendaItems.push({
					section: item.section,
					orderIndex: orderIdx++,
					contentText: sectionContentText,
					linkedDocument: null,
				});
			} else {
				// Has attached documents
				// If section has contentText (e.g. minutes approval text), save it first
				// Then save each attached document as a sub-item with its summary
				if (sectionContentText) {
					agendaItems.push({
						section: item.section,
						orderIndex: orderIdx++,
						contentText: sectionContentText,
						linkedDocument: null,
					});
				}
				// Each attached document becomes its own agenda item
				for (const doc of sectionDocs) {
					agendaItems.push({
						section: item.section,
						orderIndex: orderIdx++,
						contentText: doc.summary || null,
						linkedDocument: doc.id,
					});
				}
			}
		}
		return agendaItems;
	}, [documentsByAgendaItem, contentTextMap]);

	// Auto-save agenda when docs change on a scheduled session (e.g. removing a document)
	useEffect(() => {
		if (!pendingSaveForScheduled || !selectedSession) return;
		setPendingSaveForScheduled(false);

		const save = async () => {
			const [err] = await api.sessions.saveDraft({
				id: selectedSession,
				agendaItems: buildAgendaItems(),
			});
			if (err) {
				toast.error("Failed to save changes.");
			}
		};
		save();
	}, [pendingSaveForScheduled, selectedSession, buildAgendaItems]);

	const handleSaveDraft = async () => {
		if (!selectedSession) return;
		setActionInFlight("saving");
		try {
			const [err] = await api.sessions.saveDraft({
				id: selectedSession,
				agendaItems: buildAgendaItems(),
			});
			if (err) {
				toast.error("Failed to save draft. Please try again.");
			} else {
				await fetchSessions();
			}
		} catch {
			toast.error("Failed to save draft. Please try again.");
		} finally {
			setActionInFlight(null);
		}
	};

	const handlePublish = async () => {
		if (!selectedSession) return;
		setActionInFlight("publishing");
		try {
			// Save agenda items first before publishing
			const [saveErr] = await api.sessions.saveDraft({
				id: selectedSession,
				agendaItems: buildAgendaItems(),
			});
			if (saveErr) {
				toast.error("Failed to save before publishing. Please try again.");
				setActionInFlight(null);
				return;
			}

			const [err] = await api.sessions.publish({ id: selectedSession });
			if (err) {
				toast.error("Failed to publish session. Please try again.");
			} else {
				await fetchSessions();
			}
		} catch {
			toast.error("Failed to publish session. Please try again.");
		} finally {
			setActionInFlight(null);
		}
	};

	const handleStartPresentation = () => {
		setShowPresentationMode(true);
	};

	const handleUnpublish = async () => {
		if (!selectedSession) return;
		setActionInFlight("unpublishing");
		try {
			const [err] = await api.sessions.unpublish({ id: selectedSession });
			if (err) {
				toast.error("Failed to unpublish session. Please try again.");
			} else {
				await fetchSessions();
			}
		} catch {
			toast.error("Failed to unpublish session. Please try again.");
		} finally {
			setActionInFlight(null);
		}
	};

	const handleDeleteDraft = async () => {
		if (!selectedSession) return;
		setActionInFlight("deleting");
		try {
			const [err] = await api.sessions.delete({ id: selectedSession });
			if (err) {
				toast.error("Failed to delete session. Please try again.");
			} else {
				setSelectedSession(null);
				await fetchSessions();
			}
		} catch {
			toast.error("Failed to delete session. Please try again.");
		} finally {
			setActionInFlight(null);
		}
	};

	const handleMarkComplete = async () => {
		if (!selectedSession) return;
		setActionInFlight("completing");
		try {
			const [err] = await api.sessions.markComplete({ id: selectedSession });
			if (err) {
				toast.error("Failed to mark session complete. Please try again.");
			} else {
				await fetchSessions();
			}
		} catch {
			toast.error("Failed to mark session complete. Please try again.");
		} finally {
			setActionInFlight(null);
		}
	};

	const selectedSessionData = sessions.find((s) => s.id === selectedSession);

	if (showPresentationMode && selectedSessionData) {
		return (
			<PresentationMode
				sessionNumber={selectedSessionData.sessionNumber.toString()}
				sessionType={selectedSessionData.type}
				sessionDate={selectedSessionData.date}
				sessionTime={selectedSessionData.time}
				agendaItems={DEFAULT_AGENDA_ITEMS.map((item) => ({
					id: item.id,
					title: item.title,
					section: item.section,
					documents: [],
				}))}
				onExit={() => setShowPresentationMode(false)}
			/>
		);
	}

	if (isLoading) {
		return (
			<div className="h-full bg-gray-50 flex items-center justify-center">
				<p className="text-sm text-gray-500">Loading sessions...</p>
			</div>
		);
	}

	return (
		<div className="h-full bg-gray-50 overflow-hidden border-b border-[#e5e7eb] px-6 py-4">
			<div className="container mx-auto max-w-360 h-full flex flex-col">
				{/* Header with Title and Create Button */}
				<div className="mb-4">
					<div className="flex items-center justify-between mb-1">
						<h1 className="text-2xl font-semibold text-[#101828]">
							Session Management
						</h1>
						<Button
							onClick={() => setShowCreateDialog(true)}
							className="cursor-pointer bg-[#a60202] hover:bg-[#8a0101] text-white"
						>
							<Plus className="h-4 w-4 mr-2" />
							Create New Session
						</Button>
					</div>
					<p className="text-sm text-[#4a5565]">
						Create and manage legislative session agendas and presentations
					</p>
				</div>

				{/* Two Column Layout */}
				<div className="flex gap-4 flex-1 overflow-hidden">
					{/* Left Panel - Documents (454px) */}
					<div className="w-113.5 shrink-0 overflow-y-auto">
						<DocumentsPanel
							documents={documents}
							onViewDocument={setViewerDocumentId}
						/>
					</div>

					{/* Right Panel - Agenda */}
					<div className="flex-1 overflow-y-auto">
						<AgendaPanel
							sessions={sessions}
							selectedSession={selectedSessionData || null}
							agendaItems={DEFAULT_AGENDA_ITEMS}
							onAddDocument={handleAddDocument}
							onSaveDraft={handleSaveDraft}
							onPublish={handlePublish}
							onMarkComplete={handleMarkComplete}
							onStartPresentation={handleStartPresentation}
							onSessionChange={handleSessionChange}
							onUnpublish={handleUnpublish}
							onDeleteDraft={handleDeleteDraft}
							actionInFlight={actionInFlight}
							contentTextMap={contentTextMap}
							onContentTextChange={handleContentTextChange}
							documentsByAgendaItem={documentsByAgendaItem}
							onDocumentsByAgendaItemChange={handleDocumentsChange}
							onViewDocument={setViewerDocumentId}
						/>
					</div>
				</div>

				{/* Dialogs */}
				<CreateSessionDialog
					open={showCreateDialog}
					onOpenChange={setShowCreateDialog}
					onSessionCreated={async (id) => {
						setSelectedSession(id);
						await fetchSessions();
					}}
				/>
				<DocumentViewerDialog
					document={viewerDocument}
					open={!!viewerDocumentId}
					onOpenChange={(open) => {
						if (!open) setViewerDocumentId(null);
					}}
				/>
			</div>
		</div>
	);
}
