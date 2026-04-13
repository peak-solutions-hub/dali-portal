"use client";

import {
	formatDateInPHT,
	formatIsoDateInPHT,
	parseDateInput,
	type SessionManagementSession as SessionUI,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { useOnlineStatus } from "@repo/ui/hooks/use-online-status";
import { Plus } from "@repo/ui/lib/lucide-react";
import {
	useInfiniteQuery,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	CreateSessionDialog,
	DocumentViewerDialog,
	SaveBeforeCreateDialog,
	SessionAgendaPanel,
	SessionDocumentsPanel,
	SessionErrorState,
	SessionPageSkeleton,
} from "@/components/session-management";
import { useAgendaBuilder, useSessionActions } from "@/hooks";
import { api, orpc } from "@/lib/api.client";
import { useDraftStore } from "@/stores";

const SESSION_CACHE_STALE_TIME = Number.POSITIVE_INFINITY;
const SESSION_CACHE_GC_TIME = 30 * 60 * 1000;
const SESSION_AUTO_SYNC_INTERVAL_MS = 30 * 1000;

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
	const scheduleDate = parseDateInput(session.scheduleDate);
	if (Number.isNaN(scheduleDate.getTime())) {
		return {
			id: session.id,
			sessionNumber: session.sessionNumber,
			date: "",
			time: "",
			type: session.type as "regular" | "special",
			status: session.status as "draft" | "scheduled" | "completed",
			agendaFilePath: session.agendaFilePath ?? null,
		};
	}

	return {
		id: session.id,
		sessionNumber: session.sessionNumber,
		date: formatIsoDateInPHT(scheduleDate),
		time: formatDateInPHT(scheduleDate, {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
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
	const isOnline = useOnlineStatus();
	const [selectedSession, setSelectedSession] = useState<string | null>(null);
	type SessionDetailData = Awaited<
		ReturnType<typeof api.sessions.adminGetById>
	>[1];
	const lastAutoSyncedDetailAtRef = useRef(0);

	// Prune stale drafts once when the page mounts
	const clearExpiredDrafts = useDraftStore((s) => s.clearExpiredDrafts);
	const lastSessionId = useDraftStore((s) => s.lastSessionId);
	const setLastSessionId = useDraftStore((s) => s.setLastSessionId);
	const clearDraft = useDraftStore((s) => s.clearDraft);
	useEffect(() => {
		clearExpiredDrafts();
	}, [clearExpiredDrafts]);

	// Fetch sessions with TanStack infinite query (page-based)
	const sessionsQuery = useInfiniteQuery({
		...orpc.sessions.adminList.infiniteOptions({
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
		staleTime: SESSION_CACHE_STALE_TIME,
		gcTime: SESSION_CACHE_GC_TIME,
		refetchOnMount: false,
		refetchOnWindowFocus: "always",
		refetchOnReconnect: "always",
		refetchInterval: isOnline ? SESSION_AUTO_SYNC_INTERVAL_MS : false,
		refetchIntervalInBackground: false,
	});

	const agendaDocumentsQuery = useQuery({
		...orpc.sessions.approvedDocuments.queryOptions(),
		staleTime: SESSION_CACHE_STALE_TIME,
		gcTime: SESSION_CACHE_GC_TIME,
		refetchOnMount: false,
		refetchOnWindowFocus: "always",
		refetchOnReconnect: "always",
		refetchInterval: isOnline ? SESSION_AUTO_SYNC_INTERVAL_MS : false,
		refetchIntervalInBackground: false,
	});

	const selectedSessionDetailQuery = useQuery({
		...orpc.sessions.adminGetById.queryOptions({
			input: { id: selectedSession ?? "" },
		}),
		enabled: Boolean(selectedSession),
		staleTime: SESSION_CACHE_STALE_TIME,
		gcTime: SESSION_CACHE_GC_TIME,
		refetchOnWindowFocus: "always",
		refetchOnReconnect: "always",
		refetchInterval:
			selectedSession && isOnline ? SESSION_AUTO_SYNC_INTERVAL_MS : false,
		refetchIntervalInBackground: false,
	});

	// Flatten all loaded pages into a single sessions array
	const sessions = useMemo<SessionUI[]>(() => {
		if (!sessionsQuery.data) return [];
		return sessionsQuery.data.pages.flatMap((page) =>
			page.sessions.map(toSessionUI),
		);
	}, [sessionsQuery.data]);

	/** Invalidate sessions cache to refetch from server */
	const invalidateSessions = useCallback(async () => {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: orpc.sessions.adminList.key(),
			}),
			queryClient.invalidateQueries({
				queryKey: orpc.sessions.adminGetById.key(),
			}),
			queryClient.invalidateQueries({
				queryKey: orpc.sessions.approvedDocuments.key(),
			}),
		]);

		await Promise.all([
			queryClient.refetchQueries({
				queryKey: orpc.sessions.adminList.key(),
				type: "active",
			}),
			queryClient.refetchQueries({
				queryKey: orpc.sessions.adminGetById.key(),
				type: "active",
			}),
			queryClient.refetchQueries({
				queryKey: orpc.sessions.approvedDocuments.key(),
				type: "active",
			}),
		]);
	}, [queryClient]);

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
	const [documentsError, setDocumentsError] = useState<string | null>(null);
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
				const resolvedSourceIndex =
					sourceIndex >= 0 && srcDocs[sourceIndex]?.id === docId
						? sourceIndex
						: srcDocs.findIndex((doc) => doc.id === docId);
				if (resolvedSourceIndex === -1) return prev;

				const [moved] = srcDocs.splice(resolvedSourceIndex, 1);
				if (!moved) return prev;

				if (sourceSectionId === destSectionId) {
					// Intra-committee: update classification and reinsert at dest position
					const updated = { ...moved, classification: targetClassification };
					// Remove from source position, insert at dest
					const remaining = srcDocs;
					remaining.splice(
						destIndex > resolvedSourceIndex ? destIndex - 1 : destIndex,
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
		sessionLoadError,
		sessionLoadErrorIsNetwork,
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

	/** Resolve viewer metadata from source list first, then linked agenda items. */
	const viewerDocument = useMemo(() => {
		if (!viewerDocumentId) return null;

		const fromSourceList = documents.find((doc) => doc.id === viewerDocumentId);
		if (fromSourceList) {
			return fromSourceList;
		}

		const fromSelectedSession =
			selectedSessionDetailQuery.data?.agendaItems.find(
				(item) => item.document?.id === viewerDocumentId,
			)?.document;
		if (fromSelectedSession) {
			return {
				id: fromSelectedSession.id,
				title: fromSelectedSession.title,
				type: fromSelectedSession.type,
				number: fromSelectedSession.codeNumber,
				classification: fromSelectedSession.classification,
				receivedAt: fromSelectedSession.receivedAt,
				authors: fromSelectedSession.authors,
				sponsors: fromSelectedSession.sponsors,
			};
		}

		const fromAgendaBuilder = Object.values(documentsByAgendaItem)
			.flat()
			.find((doc) => doc.id === viewerDocumentId);

		if (!fromAgendaBuilder) return null;

		return {
			id: fromAgendaBuilder.id,
			title: fromAgendaBuilder.title,
			number: fromAgendaBuilder.codeNumber,
			classification: fromAgendaBuilder.classification,
		};
	}, [
		documents,
		documentsByAgendaItem,
		selectedSessionDetailQuery.data,
		viewerDocumentId,
	]);

	useEffect(() => {
		const queryError = agendaDocumentsQuery.error;
		if (queryError) {
			setDocumentsError(
				queryError instanceof Error
					? queryError.message
					: "Failed to load calendared documents.",
			);
			return;
		}

		setDocumentsError(null);
		setDocuments(agendaDocumentsQuery.data?.documents ?? []);
	}, [agendaDocumentsQuery.data, agendaDocumentsQuery.error]);

	const handleSessionChange = async (sessionId: string) => {
		setSelectedSession(sessionId);
		setLastSessionId(sessionId);
		lastAutoSyncedDetailAtRef.current = 0;

		const detailQueryOptions = orpc.sessions.adminGetById.queryOptions({
			input: { id: sessionId },
		});

		const cachedDetail = queryClient.getQueryData(
			detailQueryOptions.queryKey,
		) as SessionDetailData;
		if (cachedDetail) {
			await loadSession(sessionId, cachedDetail);
			lastAutoSyncedDetailAtRef.current =
				queryClient.getQueryState(detailQueryOptions.queryKey)?.dataUpdatedAt ??
				Date.now();
			return;
		}

		try {
			const detail = await queryClient.fetchQuery({
				...detailQueryOptions,
				staleTime: SESSION_CACHE_STALE_TIME,
			});
			await loadSession(sessionId, detail);
			lastAutoSyncedDetailAtRef.current =
				queryClient.getQueryState(detailQueryOptions.queryKey)?.dataUpdatedAt ??
				Date.now();
		} catch {
			await loadSession(sessionId);
			lastAutoSyncedDetailAtRef.current = Date.now();
		}
	};

	const syncSessionManagementData = useCallback(async () => {
		try {
			const detailRefreshPromise = selectedSession
				? queryClient.fetchQuery({
						...orpc.sessions.adminGetById.queryOptions({
							input: { id: selectedSession },
						}),
						staleTime: 0,
					})
				: Promise.resolve(undefined);

			const [latestDetail] = await Promise.all([
				detailRefreshPromise,
				sessionsQuery.refetch(),
				agendaDocumentsQuery.refetch(),
			]);

			if (selectedSession && latestDetail) {
				await loadSession(selectedSession, latestDetail);
			}
		} catch {
			toast.error("Failed to sync session data. Please try again.");
		}
	}, [
		agendaDocumentsQuery,
		loadSession,
		queryClient,
		sessionsQuery,
		selectedSession,
	]);

	useEffect(() => {
		if (!selectedSession || !selectedSessionDetailQuery.data) return;
		if (hasChanges || isLoadingSession) return;

		const detailUpdatedAt = selectedSessionDetailQuery.dataUpdatedAt;
		if (!detailUpdatedAt) return;
		if (detailUpdatedAt <= lastAutoSyncedDetailAtRef.current) return;

		lastAutoSyncedDetailAtRef.current = detailUpdatedAt;
		void loadSession(selectedSession, selectedSessionDetailQuery.data);
	}, [
		hasChanges,
		isLoadingSession,
		loadSession,
		selectedSession,
		selectedSessionDetailQuery.data,
		selectedSessionDetailQuery.dataUpdatedAt,
	]);

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
			try {
				await queryClient.fetchQuery({
					...orpc.sessions.adminGetById.queryOptions({
						input: { id: lastSessionId },
					}),
					staleTime: SESSION_CACHE_STALE_TIME,
				});
				await handleSessionChange(lastSessionId);
			} catch {
				// Session no longer exists on the server – clear the stale reference
				setLastSessionId(null);
			}
		};
		restore();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionsQuery.isLoading, lastSessionId, autoRestoreDone]);

	const handleAddDocument: (agendaItemId: string) => void = () => undefined;

	const onDeleteDraft = async () => {
		const deleted = await handleDeleteDraft();
		if (deleted) {
			setSelectedSession(null);
			setLastSessionId(null);
		}
	};

	const selectedSessionData = sessions.find((s) => s.id === selectedSession);

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
				{sessionsQuery.isLoading || agendaDocumentsQuery.isLoading ? (
					<SessionPageSkeleton />
				) : (
					<div className="flex gap-4 flex-1 overflow-hidden">
						{/* Left Panel - Documents (454px) */}
						<div className="w-113.5 shrink-0 overflow-y-auto">
							{documentsError && (
								<div className="mb-3">
									<SessionErrorState
										variant="documents"
										error={agendaDocumentsQuery.error}
										message={documentsError}
										onRetry={syncSessionManagementData}
									/>
								</div>
							)}
							<SessionDocumentsPanel
								documents={documents}
								onViewDocument={setViewerDocumentId}
							/>
						</div>

						{/* Right Panel - Agenda */}
						<div className="flex-1 overflow-y-auto">
							{sessionsQuery.isError ? (
								<div className="flex h-full w-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
									<SessionErrorState
										variant="sessions"
										error={sessionsQuery.error}
										message={sessionsQuery.error?.message}
										onRetry={syncSessionManagementData}
									/>
								</div>
							) : (
								<SessionAgendaPanel
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
									sessionLoadError={sessionLoadError}
									sessionLoadErrorIsNetwork={sessionLoadErrorIsNetwork}
									onRetryLoadSession={() => {
										if (selectedSession) {
											syncSessionManagementData();
										}
									}}
									onDndReorder={handleDndReorder}
									onMixedDndReorder={builder.handleMixedDndReorder}
									onWriteCommitteeState={builder.writeCommitteeState}
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
							)}
						</div>
					</div>
				)}

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
						await sessionsQuery.refetch();
						await handleSessionChange(id);
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
					documentId={viewerDocumentId}
					sessionId={selectedSession}
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
