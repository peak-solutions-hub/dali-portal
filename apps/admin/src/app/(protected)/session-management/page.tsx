"use client";

import type { SessionManagementSession as SessionUI } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Plus } from "@repo/ui/lib/lucide-react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	AgendaPanel,
	CreateSessionDialog,
	DiscardChangesDialog,
	DocumentsPanel,
	DocumentViewerDialog,
} from "@/components/session-management";
import { useAgendaBuilder, useSessionActions } from "@/hooks";
import { api, orpc } from "@/lib/api.client";

/**
 * Transform API session to the shape the UI components expect
 */
function toSessionUI(session: {
	id: string;
	sessionNumber: number;
	scheduleDate: string | Date;
	type: string;
	status: string;
	agendaFilePath?: string | null;
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
		agendaFilePath: session.agendaFilePath ?? null,
	};
}

export default function SessionManagement() {
	return <AgendaBuilderPage />;
}

function AgendaBuilderPage() {
	const queryClient = useQueryClient();

	// Fetch sessions with TanStack infinite query (page-based)
	const sessionsQuery = useInfiniteQuery(
		orpc.sessions.adminList.infiniteOptions({
			input: (pageParam) => ({
				page: pageParam,
				limit: 20,
				sortDirection: "desc" as const,
			}),
			getNextPageParam: (lastPage) =>
				lastPage.pagination.hasNextPage
					? lastPage.pagination.currentPage + 1
					: undefined,
			initialPageParam: 1,
		}),
	);

	// Flatten all loaded pages into a single sessions array
	const sessions = useMemo<SessionUI[]>(() => {
		if (!sessionsQuery.data) return [];
		return sessionsQuery.data.pages.flatMap((page) =>
			page.sessions.map(toSessionUI),
		);
	}, [sessionsQuery.data]);

	/** Invalidate sessions cache to refetch from server */
	const invalidateSessions = useCallback(async () => {
		await queryClient.invalidateQueries({
			queryKey: orpc.sessions.adminList.key(),
		});
	}, [queryClient]);

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
	const [showDiscardDialog, setShowDiscardDialog] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [viewerDocumentId, setViewerDocumentId] = useState<string | null>(null);

	// --- Agenda builder state (content, docs, ordering, dirty tracking) ---
	const builder = useAgendaBuilder();
	const {
		contentTextMap,
		documentsByAgendaItem,
		hasChanges,
		changedSections,
		orderedAgendaItems,
		highlightedItemId,
		handleContentTextChange,
		handleMoveAgendaItem,
		resetEditorState,
	} = builder;

	// --- Session action handlers (save, publish, delete, PDF upload, etc.) ---
	const actions = useSessionActions({
		selectedSession,
		sessions,
		builder,
		invalidateSessions,
	});
	const {
		actionInFlight,
		isUploadingPdf,
		isRemovingPdf,
		isLoadingSession,
		handleSessionChange: loadSession,
		handleDocumentsChange,
		handleSaveDraft,
		handlePublish,
		handleUnpublish,
		handleDeleteDraft,
		handleUploadAgendaPdf,
		handleRemoveAgendaPdf,
		handleMarkComplete,
	} = actions;

	/** Find a document by ID from the approved documents list */
	const viewerDocument =
		documents.find((d) => d.id === viewerDocumentId) ?? null;

	const fetchDocuments = useCallback(async () => {
		const [err, data] = await api.sessions.approvedDocuments({});
		if (!err && data) {
			setDocuments(data.documents);
		}
	}, []);

	useEffect(() => {
		fetchDocuments().finally(() => setIsLoading(false));
	}, [fetchDocuments]);

	const handleSessionChange = async (sessionId: string) => {
		setSelectedSession(sessionId);
		await loadSession(sessionId);
	};

	const handleAddDocument = (agendaItemId: string) => {
		console.log("Add document to agenda item:", agendaItemId);
	};

	const onDeleteDraft = async () => {
		const deleted = await handleDeleteDraft();
		if (deleted) {
			setSelectedSession(null);
		}
	};

	const selectedSessionData = sessions.find((s) => s.id === selectedSession);

	if (isLoading || sessionsQuery.isLoading) {
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
							onClick={() => {
								if (hasChanges) {
									setShowDiscardDialog(true);
								} else {
									setShowCreateDialog(true);
								}
							}}
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
							agendaItems={orderedAgendaItems}
							onAddDocument={handleAddDocument}
							onSaveDraft={handleSaveDraft}
							onPublish={handlePublish}
							onMarkComplete={handleMarkComplete}
							onSessionChange={handleSessionChange}
							onUnpublish={handleUnpublish}
							onDeleteDraft={onDeleteDraft}
							actionInFlight={actionInFlight}
							contentTextMap={contentTextMap}
							onContentTextChange={handleContentTextChange}
							documentsByAgendaItem={documentsByAgendaItem}
							onDocumentsByAgendaItemChange={handleDocumentsChange}
							onViewDocument={setViewerDocumentId}
							hasChanges={hasChanges}
							changedSections={changedSections}
							onUploadAgendaPdf={handleUploadAgendaPdf}
							onRemoveAgendaPdf={handleRemoveAgendaPdf}
							isUploadingPdf={isUploadingPdf}
							isRemovingPdf={isRemovingPdf}
							isLoadingSession={isLoadingSession}
							onMoveAgendaItem={handleMoveAgendaItem}
							highlightedItemId={highlightedItemId}
							hasNextPage={sessionsQuery.hasNextPage}
							isFetchingNextPage={sessionsQuery.isFetchingNextPage}
							onLoadMoreSessions={sessionsQuery.fetchNextPage}
						/>
					</div>
				</div>

				{/* Dialogs */}
				<CreateSessionDialog
					open={showCreateDialog}
					onOpenChange={setShowCreateDialog}
					onSessionCreated={async (id) => {
						// Reset editor state before switching to the new session
						resetEditorState();
						setSelectedSession(id);
						await invalidateSessions();
						toast.success("New session created.");
					}}
				/>
				<DiscardChangesDialog
					open={showDiscardDialog}
					onOpenChange={setShowDiscardDialog}
					onDiscard={() => {
						resetEditorState();
						setSelectedSession(null);
						setShowCreateDialog(true);
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
