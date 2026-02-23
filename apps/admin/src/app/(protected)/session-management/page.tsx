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
	DocumentsPanel,
	DocumentViewerDialog,
	SaveBeforeCreateDialog,
} from "@/components/session-management";
import { useAgendaBuilder, useSessionActions } from "@/hooks";
import { api, orpc } from "@/lib/api.client";
import { useDraftStore } from "@/stores";

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

	// Prune stale drafts once when the page mounts
	const clearExpiredDrafts = useDraftStore((s) => s.clearExpiredDrafts);
	const lastSessionId = useDraftStore((s) => s.lastSessionId);
	const setLastSessionId = useDraftStore((s) => s.setLastSessionId);
	const clearDraft = useDraftStore((s) => s.clearDraft);
	useEffect(() => {
		clearExpiredDrafts();
	}, [clearExpiredDrafts]);

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
		setDocumentsByAgendaItem,
		customTextsBySection,
		hasChanges,
		changedSections,
		orderedAgendaItems,
		isSessionEmpty,
		handleDndReorder,
		handleContentTextChange,
		addCustomText,
		updateCustomText,
		moveCustomTextToSection,
		resetEditorState,
		revertToSaved,
	} = builder;

	/**
	 * Move a document across committee groups and update its classification field.
	 * Called when a doc is dragged from one committee-group droppable to another.
	 */
	const handleCommitteeDocClassify = useCallback(
		(
			docId: string,
			sourceSectionId: string,
			sourceIndex: number,
			destSectionId: string,
			destIndex: number,
			targetClassification: string,
		) => {
			setDocumentsByAgendaItem((prev) => {
				const srcDocs = [...(prev[sourceSectionId] ?? [])].sort(
					(a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
				);
				const [moved] = srcDocs.splice(sourceIndex, 1);
				if (!moved) return prev;

				if (sourceSectionId === destSectionId) {
					// Intra-committee: update classification and reinsert at dest position
					const updated = { ...moved, classification: targetClassification };
					// Remove from source position, insert at dest
					const remaining = srcDocs;
					remaining.splice(
						destIndex > sourceIndex ? destIndex - 1 : destIndex,
						0,
						updated,
					);
					return {
						...prev,
						[sourceSectionId]: remaining.map((d, i) => ({
							...d,
							orderIndex: i,
						})),
					};
				}

				// Cross-section (shouldn't normally happen for committee, but handle it)
				const destDocs = [...(prev[destSectionId] ?? [])].sort(
					(a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
				);
				const updated = { ...moved, classification: targetClassification };
				destDocs.splice(destIndex, 0, updated);
				return {
					...prev,
					[sourceSectionId]: srcDocs.map((d, i) => ({ ...d, orderIndex: i })),
					[destSectionId]: destDocs.map((d, i) => ({ ...d, orderIndex: i })),
				};
			});
		},
		[setDocumentsByAgendaItem],
	);

	// --- Session action handlers (save, publish, delete, PDF upload, etc.) ---
	const actions = useSessionActions({
		selectedSession,
		sessions,
		builder,
		invalidateSessions,
	});
	const {
		actionInFlight,
		isRemovingPdf,
		isLoadingSession,
		removingItemIds,
		handleSessionChange: loadSession,
		handleDocumentsChange,
		handleScheduledRemoveDocument,
		handleRemoveCustomText,
		handleSaveDraft,
		handlePublish,
		handleUnpublish,
		handleDeleteDraft,
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
		setLastSessionId(sessionId);
		await loadSession(sessionId);
	};

	// After sessions have loaded, restore the last open session automatically.
	// Guard: only run once (when selectedSession is still null).
	//
	// IMPORTANT: do NOT check against the in-memory `sessions` array to decide
	// whether the session still exists. The list is paginated (20 per page) so a
	// draft session that isn't in the first page would be incorrectly treated as
	// deleted, causing lastSessionId to be cleared and the user to land on the
	// wrong (scheduled) session after a refresh. Instead, verify via direct API.
	const [autoRestoreDone, setAutoRestoreDone] = useState(false);
	useEffect(() => {
		if (autoRestoreDone) return;
		if (sessionsQuery.isLoading || !lastSessionId) return;

		const restore = async () => {
			setAutoRestoreDone(true);
			const [err, data] = await api.sessions.adminGetById({
				id: lastSessionId,
			});
			if (err || !data) {
				// Session no longer exists on the server – clear the stale reference
				setLastSessionId(null);
				return;
			}
			await handleSessionChange(lastSessionId);
		};
		restore();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionsQuery.isLoading, lastSessionId, autoRestoreDone]);

	const handleAddDocument = (agendaItemId: string) => {
		console.log("Add document to agenda item:", agendaItemId);
	};

	const onDeleteDraft = async () => {
		const deleted = await handleDeleteDraft();
		if (deleted) {
			setSelectedSession(null);
			setLastSessionId(null);
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
							onRemoveAgendaPdf={handleRemoveAgendaPdf}
							onAgendaPdfUploadSuccess={invalidateSessions}
							isRemovingPdf={isRemovingPdf}
							isLoadingSession={isLoadingSession}
							onDndReorder={handleDndReorder}
							onMixedDndReorder={builder.handleMixedDndReorder}
							onCommitteeDocClassify={handleCommitteeDocClassify}
							onDiscardChanges={() => {
								revertToSaved();
								if (selectedSession) clearDraft(selectedSession);
							}}
							customTextsBySection={customTextsBySection}
							onAddCustomText={addCustomText}
							onUpdateCustomText={updateCustomText}
							onRemoveCustomText={handleRemoveCustomText}
							onReorderCustomTexts={builder.reorderCustomTexts}
							onMoveCustomText={moveCustomTextToSection}
							onScheduledRemoveDocument={handleScheduledRemoveDocument}
							removingItemIds={removingItemIds}
							isSessionEmpty={isSessionEmpty}
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
						// Reset editor state before switching to the new session.
						// Persist lastSessionId so a refresh correctly restores this draft.
						resetEditorState();
						setSelectedSession(id);
						setLastSessionId(id);
						await invalidateSessions();
						await loadSession(id);
						toast.success("New session created.");
					}}
				/>
				<SaveBeforeCreateDialog
					open={showDiscardDialog}
					onOpenChange={setShowDiscardDialog}
					onSaveAndCreate={async () => {
						await handleSaveDraft();
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
