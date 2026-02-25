"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import type {
	SessionManagementAgendaPanelProps as AgendaPanelProps,
	SessionManagementDocument as Document,
	SessionManagementSession as Session,
} from "@repo/shared";
import { formatSessionDate } from "@repo/shared";
import { AlertCircle, Loader2, Lock } from "@repo/ui/lib/lucide-react";
import { getSessionTypeLabel } from "@repo/ui/lib/session-ui";
import { useCallback, useRef, useState } from "react";
import { CustomTextItem } from "@/hooks";
import { AgendaItemCard } from "./agenda-item-card";
import {
	ConfirmDiscardDialog,
	DeleteSessionDialog,
	MarkCompleteDialog,
	PublishSessionDialog,
	SaveDraftDialog,
	UnpublishSessionDialog,
	UnsavedChangesBeforePublishDialog,
} from "./dialogs";
import { DraftActionBar } from "./draft-action-bar";
import { ScheduledActionBar } from "./scheduled-action-bar";
import { SessionSelectorDropdown } from "./session-selector-dropdown";

export interface AttachedDocument {
	id: string;
	codeNumber: string;
	title: string;
	summary?: string;
	classification?: string;
	orderIndex?: number;
}

export function AgendaPanel({
	sessions,
	selectedSession,
	agendaItems,
	onAddDocument,
	onSaveDraft,
	onPublish,
	onMarkComplete,
	onSessionChange,
	onUnpublish,
	onDeleteDraft,
	actionInFlight,
	contentTextMap,
	onContentTextChange,
	documentsByAgendaItem,
	onDocumentsByAgendaItemChange,
	onViewDocument,
	hasChanges = true,
	changedSections,
	onRemoveAgendaPdf,
	onAgendaPdfUploadSuccess,
	isRemovingPdf = false,
	isLoadingSession = false,
	onDndReorder,
	onDiscardChanges,
	isSessionEmpty = false,
	hasNextPage,
	isFetchingNextPage,
	onLoadMoreSessions,
	customTextsBySection,
	onAddCustomText,
	onUpdateCustomText,
	onRemoveCustomText,
	onReorderCustomTexts,
	onMoveCustomText,
	onMixedDndReorder,
	onWriteCommitteeState,
	onCommitteeDocClassify,
	onScheduledRemoveDocument,
	onScheduledRemoveCustomText,
	removingItemIds,
}: AgendaPanelProps & {
	sessions: Session[];
	onSessionChange: (sessionId: string) => void;
	onUnpublish?: () => void;
	onDeleteDraft?: () => void;
	actionInFlight?: string | null;
	contentTextMap?: Record<string, string>;
	onContentTextChange?: (itemId: string, text: string) => void;
	documentsByAgendaItem: Record<string, AttachedDocument[]>;
	onDocumentsByAgendaItemChange: (
		docs: Record<string, AttachedDocument[]>,
	) => void;
	onViewDocument?: (documentId: string) => void;
	hasChanges?: boolean;
	changedSections?: Set<string>;
	onRemoveAgendaPdf?: () => void;
	onAgendaPdfUploadSuccess?: () => Promise<void>;
	isRemovingPdf?: boolean;
	isLoadingSession?: boolean;
	onDndReorder?: (
		sourceSectionId: string,
		destSectionId: string,
		sourceIndex: number,
		destIndex: number,
	) => void;
	onDiscardChanges?: () => void;
	isSessionEmpty?: boolean;
	hasNextPage?: boolean;
	isFetchingNextPage?: boolean;
	onLoadMoreSessions?: () => void;
	customTextsBySection?: Record<string, CustomTextItem[]>;
	onAddCustomText?: (sectionId: string, classification?: string) => void;
	onUpdateCustomText?: (
		sectionId: string,
		itemId: string,
		content: string,
	) => void;
	onRemoveCustomText?: (sectionId: string, itemId: string) => void;
	onReorderCustomTexts?: (
		sectionId: string,
		sourceIndex: number,
		destIndex: number,
		classification?: string,
	) => void;
	/** Cross-section move for custom text items */
	onMoveCustomText?: (
		sourceSectionId: string,
		sourceIndex: number,
		destSectionId: string,
		targetClassification?: string,
	) => void;
	/** Mixed reorder for docs + custom texts in a unified droppable */
	onMixedDndReorder?: (
		sectionId: string,
		sourceIndex: number,
		destIndex: number,
		docs: AttachedDocument[],
		customs: CustomTextItem[],
	) => void;
	/** Directly write pre-computed docs+customs for a section (used by committee reorder) */
	onWriteCommitteeState?: (
		sectionId: string,
		newDocs: AttachedDocument[],
		newCustoms: CustomTextItem[],
	) => void;
	/** Move a doc across committee groups and update its classification */
	onCommitteeDocClassify?: (
		docId: string,
		sourceSectionId: string,
		sourceIndex: number,
		destSectionId: string,
		destIndex: number,
		targetClassification: string,
	) => void;
	/** Non-optimistic remove for documents on a scheduled session */
	onScheduledRemoveDocument?: (
		agendaItemId: string,
		documentId: string,
	) => Promise<void>;
	/** Non-optimistic remove for custom text items on a scheduled session */
	onScheduledRemoveCustomText?: (
		sectionId: string,
		itemId: string,
	) => Promise<void>;
	/** IDs currently mid-remove (showing spinner). */
	removingItemIds?: Set<string>;
}) {
	const [dndError, setDndError] = useState<string | null>(null);
	const [dndErrorTimer, setDndErrorTimer] = useState<ReturnType<
		typeof setTimeout
	> | null>(null);

	const showDndError = (message: string) => {
		if (dndErrorTimer) clearTimeout(dndErrorTimer);
		setDndError(message);
		const timer = setTimeout(() => setDndError(null), 4000);
		setDndErrorTimer(timer);
	};

	const [showMarkCompleteDialog, setShowMarkCompleteDialog] = useState(false);
	const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
	const [showPublishDialog, setShowPublishDialog] = useState(false);
	const [showUnsavedBeforePublish, setShowUnsavedBeforePublish] =
		useState(false);
	const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

	// One flush ref per AgendaItemCard, keyed by item.id
	const cardFlushRefs = useRef<
		Map<string, React.MutableRefObject<(() => void) | null>>
	>(new Map());
	const getOrCreateCardFlushRef = useCallback((itemId: string) => {
		if (!cardFlushRefs.current.has(itemId)) {
			cardFlushRefs.current.set(itemId, { current: null });
		}
		return cardFlushRefs.current.get(itemId)!;
	}, []);

	// Track which card is currently active so cross-card editor switches flush the previous one
	const activeCardItemId = useRef<string | null>(null);
	const handleCardEditorOpen = useCallback((itemId: string) => {
		const prev = activeCardItemId.current;
		if (prev && prev !== itemId) {
			cardFlushRefs.current.get(prev)?.current?.();
		}
		activeCardItemId.current = itemId;
	}, []);

	/** Commit all open editors across every card before saving/publishing.
	 *  Returns true if any editor had real content that was committed (i.e. a
	 *  change was made). Returns false if all open editors were empty new items
	 *  that were auto-discarded. */
	const flushAllEditors = useCallback(() => {
		let hadContent = false;
		for (const ref of cardFlushRefs.current.values()) {
			if (ref.current?.()) hadContent = true;
		}
		activeCardItemId.current = null;
		return hadContent;
	}, []);

	const handlePublishClick = () => {
		// Flush any open editor draft into state before checking for changes.
		// - If the editor had content  → it's committed and hasChanges becomes true → show unsaved modal
		// - If the editor was empty+new → it's auto-discarded (no change) → proceed normally
		const editorHadContent = flushAllEditors();

		if (hasChanges || editorHadContent) {
			setShowUnsavedBeforePublish(true);
		} else {
			setShowPublishDialog(true);
		}
	};

	const handleSaveAndProceedToPublish = async () => {
		flushAllEditors();
		if (onSaveDraft) await onSaveDraft();
		setShowUnsavedBeforePublish(false);
		setShowPublishDialog(true);
	};

	const handleAddDocument = (agendaItemId: string) =>
		onAddDocument(agendaItemId);

	const handleDropDocument = (agendaItemId: string, document: Document) => {
		const existing = documentsByAgendaItem[agendaItemId] || [];
		if (existing.some((doc) => doc.id === document.id)) {
			const destItem = agendaItems.find((i) => i.id === agendaItemId);
			showDndError(
				`This document already exists in "${destItem?.title ?? "that section"}" and cannot be added again.`,
			);
			return;
		}
		const attachedDoc: AttachedDocument = {
			id: document.id,
			codeNumber: document.number,
			title: document.title,
			classification: document.classification,
		};
		onDocumentsByAgendaItemChange({
			...documentsByAgendaItem,
			[agendaItemId]: [...existing, attachedDoc],
		});
	};

	const handleRemoveDocument = (agendaItemId: string, documentId: string) => {
		if (isScheduled && onScheduledRemoveDocument) {
			onScheduledRemoveDocument(agendaItemId, documentId);
			return;
		}
		onDocumentsByAgendaItemChange({
			...documentsByAgendaItem,
			[agendaItemId]: (documentsByAgendaItem[agendaItemId] || []).filter(
				(doc) => doc.id !== documentId,
			),
		});
	};

	const handleUpdateDocumentSummary = (
		agendaItemId: string,
		documentId: string,
		summary: string,
	) => {
		onDocumentsByAgendaItemChange({
			...documentsByAgendaItem,
			[agendaItemId]: (documentsByAgendaItem[agendaItemId] || []).map((doc) =>
				doc.id === documentId ? { ...doc, summary } : doc,
			),
		});
	};

	const handleRemoveCustomText = (sectionId: string, itemId: string) => {
		if (isScheduled && onScheduledRemoveCustomText) {
			onScheduledRemoveCustomText(sectionId, itemId);
			return;
		}
		onRemoveCustomText?.(sectionId, itemId);
	};

	const handleDragOver = (e: React.DragEvent, agendaItemId: string) => {
		e.preventDefault();
		e.currentTarget.classList.add("bg-blue-50", "border-blue-300");
	};
	const handleDragLeave = (e: React.DragEvent) => {
		e.currentTarget.classList.remove("bg-blue-50", "border-blue-300");
	};
	const handleDrop = (e: React.DragEvent, agendaItemId: string) => {
		e.preventDefault();
		e.currentTarget.classList.remove("bg-blue-50", "border-blue-300");
		const documentData = e.dataTransfer.getData("application/json");
		if (documentData)
			handleDropDocument(agendaItemId, JSON.parse(documentData));
	};

	const isScheduled = selectedSession?.status === "scheduled";
	const isCompleted = selectedSession?.status === "completed";
	const isDraft = selectedSession?.status === "draft";

	const handleDragEnd = (result: DropResult) => {
		const { source, destination, draggableId } = result;
		if (!destination) return;
		if (
			source.droppableId === destination.droppableId &&
			source.index === destination.index
		)
			return;

		// Resolve any droppable ID → { sectionId, classification? }
		const resolveDroppable = (
			id: string,
		): { sectionId: string; classification?: string } => {
			if (id.startsWith("drop-zone::"))
				return { sectionId: id.slice("drop-zone::".length) };
			if (id.startsWith("committee-group::"))
				return {
					sectionId: "committee_reports",
					classification: id.slice("committee-group::".length),
				};
			if (id.startsWith("committee-drop::"))
				return { sectionId: "committee_reports" };
			return { sectionId: id };
		};

		// Reorder items within a single committee group and write back to flat arrays.
		// sourceIdx / destIdx are local indices within the group (as given by @hello-pangea/dnd).
		const reorderCommitteeGroup = (
			classification: string,
			sourceIdx: number,
			destIdx: number,
		) => {
			const flatDocs = documentsByAgendaItem["committee_reports"] ?? [];
			const flatCustoms = customTextsBySection?.["committee_reports"] ?? [];

			const groupDocs = flatDocs
				.filter((d) => (d.classification ?? "uncategorized") === classification)
				.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
			const groupCustoms = flatCustoms
				.filter((c) => (c.classification ?? "uncategorized") === classification)
				.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

			// Build unified sorted list for this group
			const unified: Array<
				| { type: "doc"; item: AttachedDocument }
				| { type: "custom"; item: CustomTextItem }
			> = [
				...groupDocs.map((d) => ({ type: "doc" as const, item: d })),
				...groupCustoms.map((c) => ({ type: "custom" as const, item: c })),
			].sort((a, b) => (a.item.orderIndex ?? 0) - (b.item.orderIndex ?? 0));

			const clamped = Math.max(0, Math.min(destIdx, unified.length - 1));
			const [moved] = unified.splice(sourceIdx, 1);
			if (!moved) return;
			unified.splice(clamped, 0, moved);

			// Re-assign orderIndex sequentially across the full unified array (shared namespace)
			// so docs and custom texts sort correctly relative to each other after reorder.
			const groupIds = new Set(unified.map((e) => e.item.id));
			const reorderedDocs: AttachedDocument[] = [];
			const reorderedCustoms: CustomTextItem[] = [];
			unified.forEach((e, i) => {
				if (e.type === "doc")
					reorderedDocs.push({
						...(e.item as AttachedDocument),
						orderIndex: i,
					});
				else
					reorderedCustoms.push({
						...(e.item as CustomTextItem),
						orderIndex: i,
					});
			});

			// Merge: keep non-group items, replace group items with reordered versions
			const newDocs = [
				...flatDocs.filter((d) => !groupIds.has(d.id)),
				...reorderedDocs,
			];
			const newCustoms = [
				...flatCustoms.filter((c) => !groupIds.has(c.id)),
				...reorderedCustoms,
			];

			// Write the reordered arrays directly — bypasses the splice logic in handleMixedDndReorder
			// which would corrupt order when multiple docs share the same section.
			// Fall back to onMixedDndReorder if onWriteCommitteeState is not yet wired by parent.
			if (onWriteCommitteeState) {
				onWriteCommitteeState("committee_reports", newDocs, newCustoms);
			} else {
				// Fallback: use no-op splice (sourceIndex === destIndex === 0) to write state.
				// This is the old behaviour and is safe when there is only one doc per group.
				onMixedDndReorder?.("committee_reports", 0, 0, newDocs, newCustoms);
			}
		};

		// ── Custom text drag ──────────────────────────────────────────────────────
		// draggableId: "custom::<sectionId>::<customIndex>::<docCount>::<itemId>"
		if (draggableId.startsWith("custom::")) {
			const parts = draggableId.split("::");
			const customSourceIndex = parseInt(parts[2] ?? "0", 10);
			const docCount = parseInt(parts[3] ?? "0", 10);

			const src = resolveDroppable(source.droppableId);
			const dest = resolveDroppable(destination.droppableId);

			// Intra-group reorder (same droppable)
			if (source.droppableId === destination.droppableId) {
				if (src.classification) {
					// Committee group: reorder within group
					reorderCommitteeGroup(
						src.classification,
						source.index,
						destination.index,
					);
				} else if (onMixedDndReorder) {
					onMixedDndReorder(
						src.sectionId,
						source.index,
						destination.index,
						documentsByAgendaItem[src.sectionId] ?? [],
						customTextsBySection?.[src.sectionId] ?? [],
					);
				} else {
					const customDestIndex = Math.max(0, destination.index - docCount);
					onReorderCustomTexts?.(
						src.sectionId,
						customSourceIndex,
						customDestIndex,
					);
				}
				return;
			}

			// Cross-group within committee (e.g. finance → health)
			// Must NOT call onMoveCustomText here — source and dest are the same section key
			// ("committee_reports"), so the generic move would append without removing, duplicating the item.
			// Instead, update the classification in-place and write back via onMixedDndReorder.
			if (
				src.sectionId === "committee_reports" &&
				dest.sectionId === "committee_reports"
			) {
				if (!dest.classification) {
					showDndError("Drop onto a specific committee group to reassign.");
					return;
				}
				// Use the item ID encoded in the draggableId (last segment) for a safe lookup
				// that works regardless of group-local vs flat index differences.
				const customItemId = parts[parts.length - 1]!;
				const flatDocs = documentsByAgendaItem["committee_reports"] ?? [];
				const flatCustoms = customTextsBySection?.["committee_reports"] ?? [];
				if (!flatCustoms.some((c) => c.id === customItemId)) return;
				const updatedCustoms = flatCustoms.map((c) =>
					c.id === customItemId
						? { ...c, classification: dest.classification }
						: c,
				);
				// Write reclassified customs directly — bypasses splice logic
				if (onWriteCommitteeState) {
					onWriteCommitteeState("committee_reports", flatDocs, updatedCustoms);
				} else {
					onMixedDndReorder?.(
						"committee_reports",
						0,
						0,
						flatDocs,
						updatedCustoms,
					);
				}
				return;
			}

			// Any section → committee: require existing groups
			if (dest.sectionId === "committee_reports") {
				const hasExistingGroups =
					(documentsByAgendaItem["committee_reports"] ?? []).length > 0 ||
					(customTextsBySection?.["committee_reports"] ?? []).some(
						(ct) => ct.classification && ct.classification !== "uncategorized",
					);
				if (!hasExistingGroups) {
					showDndError(
						"There are no existing committee classifications to drop into. Add a committee first.",
					);
					return;
				}
				if (!dest.classification) {
					showDndError(
						"Drop onto a specific committee group to assign a classification.",
					);
					return;
				}
			}

			// committee → section, section → committee-group, or section → section
			onMoveCustomText?.(
				src.sectionId,
				customSourceIndex,
				dest.sectionId,
				dest.classification,
			);
			return;
		}

		// ── Document drag ─────────────────────────────────────────────────────────
		// draggableId: "<sectionId>::<docId>"  (last segment is always docId)
		const docIdParts = draggableId.split("::");
		const docId = docIdParts[docIdParts.length - 1]!;

		const src = resolveDroppable(source.droppableId);
		const dest = resolveDroppable(destination.droppableId);

		// Intra-group reorder (same droppable)
		if (source.droppableId === destination.droppableId) {
			if (src.classification) {
				reorderCommitteeGroup(
					src.classification,
					source.index,
					destination.index,
				);
			} else {
				const currentDocs = documentsByAgendaItem[src.sectionId] ?? [];
				const currentCustoms = customTextsBySection?.[src.sectionId] ?? [];
				if (onMixedDndReorder && currentCustoms.length > 0) {
					onMixedDndReorder(
						src.sectionId,
						source.index,
						destination.index,
						currentDocs,
						currentCustoms,
					);
				} else {
					onDndReorder?.(
						src.sectionId,
						src.sectionId,
						source.index,
						destination.index,
					);
				}
			}
			return;
		}

		// Cross-group / cross-section document transfer
		// Duplicate check must run BEFORE any state mutation
		const destAllDocs = documentsByAgendaItem[dest.sectionId] ?? [];
		if (destAllDocs.some((doc) => doc.id === docId)) {
			const destItem = agendaItems.find((i) => i.id === dest.sectionId);
			showDndError(
				`This document already exists in "${destItem?.title ?? "that section"}" and cannot be added again.`,
			);
			return;
		}

		// Committee source: source.index is group-local; find true flat index by ID
		const allSrcDocs = documentsByAgendaItem[src.sectionId] ?? [];
		const trueSourceIndex = src.classification
			? allSrcDocs.findIndex((d) => d.id === docId)
			: source.index;
		if (trueSourceIndex === -1) return;

		// Committee destination: map group-local dest index to flat array position
		const trueDestIndex = dest.classification
			? (() => {
					const destGroupDocs = destAllDocs
						.filter(
							(d) =>
								(d.classification ?? "uncategorized") === dest.classification,
						)
						.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
					const anchor =
						destGroupDocs[destination.index - 1] ??
						destGroupDocs[destGroupDocs.length - 1];
					if (!anchor) return destAllDocs.length;
					return destAllDocs.findIndex((d) => d.id === anchor.id) + 1;
				})()
			: destination.index;

		// Moving into a committee group: update the doc's classification too
		if (dest.classification) {
			onCommitteeDocClassify?.(
				docId,
				src.sectionId,
				trueSourceIndex,
				dest.sectionId,
				trueDestIndex,
				dest.classification,
			);
		} else {
			onDndReorder?.(
				src.sectionId,
				dest.sectionId,
				trueSourceIndex,
				trueDestIndex,
			);
		}
	};

	return (
		<div className="flex h-full w-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5">
			<SessionSelectorDropdown
				sessions={sessions}
				selectedSession={selectedSession}
				onSessionChange={onSessionChange}
				hasNextPage={hasNextPage}
				isFetchingNextPage={isFetchingNextPage}
				onLoadMoreSessions={onLoadMoreSessions}
			/>

			{selectedSession ? (
				<>
					{isLoadingSession ? (
						<div className="flex-1 flex items-center justify-center">
							<div className="flex flex-col items-center gap-3">
								<Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
								<p className="text-sm text-gray-500">Loading session data...</p>
							</div>
						</div>
					) : (
						<>
							{isScheduled && (
								<ScheduledActionBar
									selectedSession={selectedSession}
									actionInFlight={actionInFlight}
									onShowUnpublishDialog={() => setShowUnpublishDialog(true)}
									onShowMarkCompleteDialog={() =>
										setShowMarkCompleteDialog(true)
									}
									onRemoveAgendaPdf={onRemoveAgendaPdf}
									onAgendaPdfUploadSuccess={onAgendaPdfUploadSuccess}
									isRemovingPdf={isRemovingPdf}
								/>
							)}

							{isCompleted && (
								<div className="flex items-center gap-2 p-3 bg-gray-100 border border-gray-200 rounded-lg">
									<Lock className="h-4 w-4 text-gray-500 shrink-0" />
									<p className="text-sm text-gray-600">
										This session is completed and locked from editing.
									</p>
								</div>
							)}

							{dndError && (
								<div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 animate-in fade-in slide-in-from-top-1 duration-200">
									<AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
									<span>{dndError}</span>
									<button
										type="button"
										onClick={() => setDndError(null)}
										className="ml-auto shrink-0 text-red-400 hover:text-red-600 transition-colors"
									>
										✕
									</button>
								</div>
							)}

							<DragDropContext onDragEnd={handleDragEnd}>
								<div className="flex-1 overflow-y-auto min-h-0">
									<div className="flex flex-col gap-3">
										{agendaItems.map((item) => (
											<div
												key={item.id}
												onDragOver={(e) =>
													isDraft && handleDragOver(e, item.id)
												}
												onDragLeave={isDraft ? handleDragLeave : undefined}
												onDrop={(e) => isDraft && handleDrop(e, item.id)}
												className={`transition-colors rounded-lg ${isCompleted ? "opacity-75" : ""}`}
											>
												<AgendaItemCard
													item={item}
													documents={documentsByAgendaItem[item.id]}
													sessions={sessions}
													selectedSessionId={selectedSession?.id}
													contentText={contentTextMap?.[item.id]}
													onContentTextChange={
														isDraft ? onContentTextChange : undefined
													}
													onAddDocument={
														isDraft ? handleAddDocument : undefined
													}
													onRemoveDocument={
														isCompleted ? undefined : handleRemoveDocument
													}
													onUpdateDocumentSummary={
														isDraft ? handleUpdateDocumentSummary : undefined
													}
													onViewDocument={onViewDocument}
													isDndEnabled={isDraft && !!onDndReorder}
													isModified={changedSections?.has(item.id)}
													removingItemIds={(() => {
														// If any item in this section is mid-remove, disable ALL Remove buttons.
														if (!isScheduled || !removingItemIds?.size)
															return removingItemIds;
														const sectionDocs =
															documentsByAgendaItem[item.id] ?? [];
														const sectionCustoms =
															customTextsBySection?.[item.id] ?? [];
														const allIds = [
															...sectionDocs.map((d) => d.id),
															...sectionCustoms.map((c) => c.id),
														];
														const sectionBusy = allIds.some((id) =>
															removingItemIds.has(id),
														);
														if (!sectionBusy) return removingItemIds;
														return new Set([...removingItemIds, ...allIds]);
													})()}
													customTexts={customTextsBySection?.[item.id]}
													onAddCustomText={
														isDraft ? onAddCustomText : undefined
													}
													onUpdateCustomText={
														isDraft ? onUpdateCustomText : undefined
													}
													onRemoveCustomText={
														!isCompleted ? handleRemoveCustomText : undefined
													}
													onReorderCustomTexts={
														isDraft ? onReorderCustomTexts : undefined
													}
													isCustomTextReadOnly={!isDraft}
													flushRef={getOrCreateCardFlushRef(item.id)}
													onEditorOpen={() => handleCardEditorOpen(item.id)}
												/>
											</div>
										))}
									</div>
								</div>
							</DragDropContext>

							{!isScheduled && !isCompleted && (
								<DraftActionBar
									actionInFlight={actionInFlight}
									hasChanges={hasChanges}
									isSessionEmpty={isSessionEmpty}
									onShowSaveDraftDialog={() => setShowSaveDraftDialog(true)}
									onShowPublishDialog={handlePublishClick}
									onShowDeleteDialog={() => setShowDeleteDialog(true)}
									onDiscardChanges={() => setShowConfirmDiscard(true)}
								/>
							)}
						</>
					)}
				</>
			) : (
				<div className="flex-1 flex items-center justify-center">
					<p className="text-base text-gray-500">
						Select a session from the dropdown above to get started.
					</p>
				</div>
			)}

			{selectedSession && (
				<>
					<MarkCompleteDialog
						open={showMarkCompleteDialog}
						onOpenChange={setShowMarkCompleteDialog}
						sessionNumber={selectedSession.sessionNumber.toString()}
						sessionType={getSessionTypeLabel(selectedSession.type)}
						sessionDate={formatSessionDate(selectedSession.date)}
						onConfirm={onMarkComplete}
					/>
					<UnpublishSessionDialog
						open={showUnpublishDialog}
						onOpenChange={setShowUnpublishDialog}
						sessionId={selectedSession.id}
						sessionNumber={selectedSession.sessionNumber.toString()}
						onUnpublished={onUnpublish}
					/>
					<DeleteSessionDialog
						open={showDeleteDialog}
						onOpenChange={setShowDeleteDialog}
						sessionId={selectedSession.id}
						sessionNumber={selectedSession.sessionNumber.toString()}
						onDeleted={onDeleteDraft}
					/>
					<SaveDraftDialog
						open={showSaveDraftDialog}
						onOpenChange={setShowSaveDraftDialog}
						sessionNumber={selectedSession.sessionNumber.toString()}
						onConfirm={async () => {
							flushAllEditors();
							await onSaveDraft?.();
						}}
					/>
					<PublishSessionDialog
						open={showPublishDialog}
						onOpenChange={setShowPublishDialog}
						sessionNumber={selectedSession.sessionNumber.toString()}
						onConfirm={async () => {
							flushAllEditors();
							await onPublish?.();
						}}
					/>
				</>
			)}

			<UnsavedChangesBeforePublishDialog
				open={showUnsavedBeforePublish}
				onOpenChange={setShowUnsavedBeforePublish}
				onSaveAndProceed={handleSaveAndProceedToPublish}
				onCancel={() => setShowUnsavedBeforePublish(false)}
			/>
			<ConfirmDiscardDialog
				open={showConfirmDiscard}
				onOpenChange={setShowConfirmDiscard}
				onConfirm={() => onDiscardChanges?.()}
			/>
		</div>
	);
}
