"use client";

import type {
	SessionManagementAgendaPanelProps as AgendaPanelProps,
	SessionManagementDocument as Document,
	SessionManagementSession as Session,
} from "@repo/shared";
import { formatSessionDate } from "@repo/shared";
import { Loader2, Lock } from "@repo/ui/lib/lucide-react";
import { getSessionTypeLabel } from "@repo/ui/lib/session-ui";
import { useState } from "react";
import { AgendaItemCard } from "./agenda-item-card";
import {
	DeleteSessionDialog,
	MarkCompleteDialog,
	PublishSessionDialog,
	SaveDraftDialog,
	UnpublishSessionDialog,
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
	onUploadAgendaPdf,
	onRemoveAgendaPdf,
	isUploadingPdf = false,
	isRemovingPdf = false,
	isLoadingSession = false,
	onMoveAgendaItem,
	highlightedItemId,
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
	onUploadAgendaPdf?: (file: File) => void;
	onRemoveAgendaPdf?: () => void;
	isUploadingPdf?: boolean;
	isRemovingPdf?: boolean;
	isLoadingSession?: boolean;
	onMoveAgendaItem?: (itemId: string, direction: "up" | "down") => void;
	highlightedItemId?: string | null;
	hasNextPage?: boolean;
	isFetchingNextPage?: boolean;
	onLoadMoreSessions?: () => void;
}) {
	const [showMarkCompleteDialog, setShowMarkCompleteDialog] = useState(false);
	const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
	const [showPublishDialog, setShowPublishDialog] = useState(false);

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
									onUploadAgendaPdf={onUploadAgendaPdf}
									onRemoveAgendaPdf={onRemoveAgendaPdf}
									isUploadingPdf={isUploadingPdf}
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

							{/* Agenda Items */}
							<div className="flex-1 overflow-y-auto min-h-0">
								<div className="flex flex-col gap-3">
									{agendaItems.map((item, index) => (
										<div
											key={item.id}
											onDragOver={(e) => isDraft && handleDragOver(e, item.id)}
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
												onAddDocument={isDraft ? handleAddDocument : undefined}
												onRemoveDocument={
													isCompleted ? undefined : handleRemoveDocument
												}
												onUpdateDocumentSummary={
													isDraft ? handleUpdateDocumentSummary : undefined
												}
												onViewDocument={onViewDocument}
												onMoveUp={
													isDraft && onMoveAgendaItem
														? () => onMoveAgendaItem(item.id, "up")
														: undefined
												}
												onMoveDown={
													isDraft && onMoveAgendaItem
														? () => onMoveAgendaItem(item.id, "down")
														: undefined
												}
												isFirst={index === 0}
												isLast={index === agendaItems.length - 1}
												isHighlighted={highlightedItemId === item.id}
												isModified={changedSections?.has(item.id)}
											/>
										</div>
									))}
								</div>
							</div>

							{/* Action Buttons - Only for Draft Sessions */}
							{!isScheduled && !isCompleted && (
								<DraftActionBar
									actionInFlight={actionInFlight}
									hasChanges={hasChanges}
									onShowSaveDraftDialog={() => setShowSaveDraftDialog(true)}
									onShowPublishDialog={() => setShowPublishDialog(true)}
									onShowDeleteDialog={() => setShowDeleteDialog(true)}
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
		</div>
	);
}
