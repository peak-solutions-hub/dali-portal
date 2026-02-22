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
import { useState } from "react";
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
	key: string;
	title: string;
	summary?: string;
	classification?: string;
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
	isRemovingPdf = false,
	onAgendaPdfUploadSuccess,
	isLoadingSession = false,
	onDndReorder,
	onDiscardChanges,
	isSessionEmpty = false,
	hasNextPage,
	isFetchingNextPage,
	onLoadMoreSessions,
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
	isRemovingPdf?: boolean;
	/** Called after agenda PDF is successfully uploaded so parent can invalidate */
	onAgendaPdfUploadSuccess?: () => Promise<void>;
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

	/**
	 * When "Finalize & Publish" is clicked we check for unsaved changes first.
	 * If there are unsaved changes we show the save-before-publish dialog,
	 * otherwise we go straight to the publish confirmation dialog.
	 */
	const handlePublishClick = () => {
		if (hasChanges) {
			setShowUnsavedBeforePublish(true);
		} else {
			setShowPublishDialog(true);
		}
	};

	/**
	 * Save the draft, close the unsaved-changes dialog, then open the publish
	 * confirmation dialog.
	 */
	const handleSaveAndProceedToPublish = async () => {
		if (onSaveDraft) await onSaveDraft();
		setShowUnsavedBeforePublish(false);
		setShowPublishDialog(true);
	};

	const handleAddDocument = (agendaItemId: string) => {
		onAddDocument(agendaItemId);
	};

	const handleDropDocument = (agendaItemId: string, document: Document) => {
		// Prevent duplicate documents in the same section
		const existing = documentsByAgendaItem[agendaItemId] || [];
		if (existing.some((doc) => doc.id === document.id)) {
			return; // Already attached to this section
		}

		const attachedDoc: AttachedDocument = {
			id: document.id,
			key: document.number,
			title: document.title,
			classification: document.classification,
		};

		onDocumentsByAgendaItemChange({
			...documentsByAgendaItem,
			[agendaItemId]: [...existing, attachedDoc],
		});
	};

	const handleRemoveDocument = (agendaItemId: string, documentId: string) => {
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
		if (documentData) {
			const document: Document = JSON.parse(documentData);
			handleDropDocument(agendaItemId, document);
		}
	};

	const isScheduled = selectedSession?.status === "scheduled";
	const isCompleted = selectedSession?.status === "completed";
	const isDraft = selectedSession?.status === "draft";

	/** Handle DnD reorder via @hello-pangea/dnd */
	const handleDragEnd = (result: DropResult) => {
		const { source, destination, draggableId } = result;
		if (!destination) return; // dropped outside a droppable
		if (
			source.droppableId === destination.droppableId &&
			source.index === destination.index
		)
			return; // dropped in the same spot

		// draggableId format: "<sourceSectionId>::<docId>"
		// Extract the actual document id so we can check for duplicates.
		const docId = draggableId.includes("::")
			? draggableId.split("::")[1]
			: draggableId;

		// If the document is being moved to a DIFFERENT section, check whether
		// that destination section already contains this document and bail out
		// to prevent cross-section duplicates.
		if (source.droppableId !== destination.droppableId) {
			const destDocs = documentsByAgendaItem[destination.droppableId] ?? [];
			if (destDocs.some((doc) => doc.id === docId)) {
				const destItem = agendaItems.find(
					(i) => i.id === destination.droppableId,
				);
				const sectionName = destItem?.title ?? "that section";
				showDndError(
					`This document already exists in "${sectionName}" and cannot be added again.`,
				);
				return; // would create a duplicate — cancel
			}
		}

		onDndReorder?.(
			source.droppableId,
			destination.droppableId,
			source.index,
			destination.index,
		);
	};

	return (
		<div className="flex h-full w-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5">
			{/* Session Selector Dropdown */}
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

							{/* DnD duplicate-drop error banner */}
							{dndError && (
								<div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 animate-in fade-in slide-in-from-top-1 duration-200">
									<AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
									<span>{dndError}</span>
									<button
										type="button"
										onClick={() => setDndError(null)}
										className="ml-auto shrink-0 text-red-400 hover:text-red-600 transition-colors"
										aria-label="Dismiss"
									>
										✕
									</button>
								</div>
							)}

							{/* Agenda Items */}
							<DragDropContext onDragEnd={handleDragEnd}>
								<div className="flex-1 overflow-y-auto min-h-0">
									<div className="flex flex-col gap-3">
										{agendaItems.map((item, index) => (
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
												/>
											</div>
										))}
									</div>
								</div>
							</DragDropContext>

							{/* Action Buttons - Only for Draft Sessions */}
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
					<div className="text-center">
						<p className="text-base text-gray-500">
							Select a session from the dropdown above to get started.
						</p>
					</div>
				</div>
			)}

			{/* Mark Complete Dialog */}
			{selectedSession && (
				<MarkCompleteDialog
					open={showMarkCompleteDialog}
					onOpenChange={setShowMarkCompleteDialog}
					sessionNumber={selectedSession.sessionNumber.toString()}
					sessionType={getSessionTypeLabel(selectedSession.type)}
					sessionDate={formatSessionDate(selectedSession.date)}
					onConfirm={onMarkComplete}
				/>
			)}

			{/* Unpublish Dialog */}
			{selectedSession && (
				<UnpublishSessionDialog
					open={showUnpublishDialog}
					onOpenChange={setShowUnpublishDialog}
					sessionId={selectedSession.id}
					sessionNumber={selectedSession.sessionNumber.toString()}
					onUnpublished={onUnpublish}
				/>
			)}

			{/* Delete Draft Dialog */}
			{selectedSession && (
				<DeleteSessionDialog
					open={showDeleteDialog}
					onOpenChange={setShowDeleteDialog}
					sessionId={selectedSession.id}
					sessionNumber={selectedSession.sessionNumber.toString()}
					onDeleted={onDeleteDraft}
				/>
			)}

			{/* Save Draft Dialog */}
			{selectedSession && (
				<SaveDraftDialog
					open={showSaveDraftDialog}
					onOpenChange={setShowSaveDraftDialog}
					sessionNumber={selectedSession.sessionNumber.toString()}
					onConfirm={onSaveDraft}
				/>
			)}

			{/* Publish Session Dialog */}
			{selectedSession && (
				<PublishSessionDialog
					open={showPublishDialog}
					onOpenChange={setShowPublishDialog}
					sessionNumber={selectedSession.sessionNumber.toString()}
					onConfirm={onPublish}
				/>
			)}

			{/* Unsaved Changes Before Publish Dialog */}
			<UnsavedChangesBeforePublishDialog
				open={showUnsavedBeforePublish}
				onOpenChange={setShowUnsavedBeforePublish}
				onSaveAndProceed={handleSaveAndProceedToPublish}
				onCancel={() => setShowUnsavedBeforePublish(false)}
			/>

			{/* Confirm Discard Changes Dialog */}
			<ConfirmDiscardDialog
				open={showConfirmDiscard}
				onOpenChange={setShowConfirmDiscard}
				onConfirm={() => onDiscardChanges?.()}
			/>
		</div>
	);
}
