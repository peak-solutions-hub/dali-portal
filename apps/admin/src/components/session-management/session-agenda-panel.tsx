"use client";

import type {
	SessionManagementDocument as Document,
	SessionManagementSession as Session,
	SessionManagementAgendaItem,
} from "@repo/shared";
import { AgendaDocument, CustomTextItem } from "@repo/shared";
import { Loader2 } from "@repo/ui/lib/lucide-react";
import { useAgendaPanelDialogs } from "../../hooks/session-management/use-agenda-panel-dialogs";
import { useAgendaPanelDnd } from "../../hooks/session-management/use-agenda-panel-dnd";
import {
	SessionAgendaItemList,
	SessionAgendaPanelDialogs,
	SessionDraftActionBar,
	SessionScheduledActionBar,
	SessionSelectorDropdown,
	SessionStatusBanner,
} from "./agenda-panel";

export interface SessionAgendaPanelProps {
	sessions: Session[];
	selectedSession: Session | null;
	agendaItems: SessionManagementAgendaItem[];
	onAddDocument: (itemId: string) => void;
	onSaveDraft: () => void;
	onPublish: () => void;
	onMarkComplete?: () => void;
	onSessionChange: (sessionId: string) => void;
	onUnpublish?: () => void;
	onDeleteDraft?: () => void;
	actionInFlight?: string | null;
	contentTextMap?: Record<string, string>;
	onContentTextChange?: (itemId: string, text: string) => void;
	documentsByAgendaItem: Record<string, AgendaDocument[]>;
	onDocumentsByAgendaItemChange: (
		docs: Record<string, AgendaDocument[]>,
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
	onMoveCustomText?: (
		sourceSectionId: string,
		sourceIndex: number,
		destSectionId: string,
		targetClassification?: string,
	) => void;
	onMixedDndReorder?: (
		sectionId: string,
		sourceIndex: number,
		destIndex: number,
		docs: AgendaDocument[],
		customs: CustomTextItem[],
	) => void;
	onWriteCommitteeState?: (
		sectionId: string,
		newDocs: AgendaDocument[],
		newCustoms: CustomTextItem[],
	) => void;
	onCommitteeDocClassify?: (
		docId: string,
		sourceSectionId: string,
		sourceIndex: number,
		destSectionId: string,
		destIndex: number,
		targetClassification: string,
	) => void;
	onScheduledRemoveDocument?: (
		agendaItemId: string,
		documentId: string,
	) => Promise<void>;
	onScheduledRemoveCustomText?: (
		sectionId: string,
		itemId: string,
	) => Promise<void>;
	removingItemIds?: Set<string>;
}

export function SessionAgendaPanel({
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
}: SessionAgendaPanelProps) {
	const isScheduled = selectedSession?.status === "scheduled";
	const isCompleted = selectedSession?.status === "completed";
	const isDraft = selectedSession?.status === "draft";

	// ── Dialog state + editor flush ───────────────────────────────────────────
	const dialogs = useAgendaPanelDialogs({
		hasChanges,
		onSaveDraft,
		onPublish,
	});

	// ── DnD ───────────────────────────────────────────────────────────────────
	const dnd = useAgendaPanelDnd({
		agendaItems,
		documentsByAgendaItem,
		customTextsBySection,
		onDndReorder,
		onMixedDndReorder,
		onWriteCommitteeState,
		onCommitteeDocClassify,
		onReorderCustomTexts,
		onMoveCustomText,
	});

	// ── Document handlers ─────────────────────────────────────────────────────
	const handleDropDocument = (agendaItemId: string, document: Document) => {
		const existing = documentsByAgendaItem[agendaItemId] || [];
		if (existing.some((doc) => doc.id === document.id)) {
			const destItem = agendaItems.find((i) => i.id === agendaItemId);
			dnd.setDndError(
				`This document already exists in "${destItem?.title ?? "that section"}" and cannot be added again.`,
			);
			return;
		}
		const attachedDoc: AgendaDocument = {
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
								<SessionScheduledActionBar
									selectedSession={selectedSession}
									actionInFlight={actionInFlight}
									onShowUnpublishDialog={() =>
										dialogs.setShowUnpublishDialog(true)
									}
									onShowMarkCompleteDialog={() =>
										dialogs.setShowMarkCompleteDialog(true)
									}
									onRemoveAgendaPdf={onRemoveAgendaPdf}
									onAgendaPdfUploadSuccess={onAgendaPdfUploadSuccess}
									isRemovingPdf={isRemovingPdf}
								/>
							)}

							<SessionStatusBanner
								isCompleted={isCompleted}
								dndError={dnd.dndError}
								onDismissDndError={() => dnd.setDndError(null)}
							/>

							<SessionAgendaItemList
								agendaItems={agendaItems}
								documentsByAgendaItem={documentsByAgendaItem}
								customTextsBySection={customTextsBySection}
								contentTextMap={contentTextMap}
								sessions={sessions}
								selectedSessionId={selectedSession?.id}
								isDraft={isDraft}
								isCompleted={isCompleted}
								isScheduled={isScheduled}
								changedSections={changedSections}
								removingItemIds={removingItemIds}
								onDndReorder={onDndReorder}
								onContentTextChange={onContentTextChange}
								onAddDocument={onAddDocument}
								onRemoveDocument={handleRemoveDocument}
								onUpdateDocumentSummary={handleUpdateDocumentSummary}
								onViewDocument={onViewDocument}
								onAddCustomText={onAddCustomText}
								onUpdateCustomText={onUpdateCustomText}
								onRemoveCustomText={handleRemoveCustomText}
								onReorderCustomTexts={onReorderCustomTexts}
								getOrCreateCardFlushRef={dialogs.getOrCreateCardFlushRef}
								onCardEditorOpen={dialogs.handleCardEditorOpen}
								onDragEnd={dnd.handleDragEnd}
								onDragOver={dnd.handleDragOver}
								onDragLeave={dnd.handleDragLeave}
								onDropDocument={handleDropDocument}
							/>

							{!isScheduled && !isCompleted && (
								<SessionDraftActionBar
									actionInFlight={actionInFlight}
									hasChanges={hasChanges}
									isSessionEmpty={isSessionEmpty}
									onShowSaveDraftDialog={() =>
										dialogs.setShowSaveDraftDialog(true)
									}
									onShowPublishDialog={dialogs.handlePublishClick}
									onShowDeleteDialog={() => dialogs.setShowDeleteDialog(true)}
									onDiscardChanges={() => dialogs.setShowConfirmDiscard(true)}
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

			<SessionAgendaPanelDialogs
				selectedSession={selectedSession}
				{...dialogs}
				onSaveDraft={onSaveDraft}
				onPublish={onPublish}
				onMarkComplete={onMarkComplete}
				onUnpublish={onUnpublish}
				onDeleteDraft={onDeleteDraft}
				onDiscardChanges={onDiscardChanges}
			/>
		</div>
	);
}
