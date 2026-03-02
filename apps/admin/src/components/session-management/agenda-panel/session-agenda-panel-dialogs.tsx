import type { SessionManagementSession } from "@repo/shared";
import { formatSessionDate } from "@repo/shared";
import { getSessionTypeLabel } from "@repo/ui/lib/session-ui";
import {
	ConfirmDiscardDialog,
	DeleteSessionDialog,
	MarkCompleteDialog,
	PublishSessionDialog,
	SaveDraftDialog,
	UnpublishSessionDialog,
	UnsavedChangesBeforePublishDialog,
} from "../dialogs";

interface SessionAgendaPanelDialogsProps {
	selectedSession: SessionManagementSession | null;

	// Dialog visibility
	showMarkCompleteDialog: boolean;
	setShowMarkCompleteDialog: (v: boolean) => void;
	showUnpublishDialog: boolean;
	setShowUnpublishDialog: (v: boolean) => void;
	showDeleteDialog: boolean;
	setShowDeleteDialog: (v: boolean) => void;
	showSaveDraftDialog: boolean;
	setShowSaveDraftDialog: (v: boolean) => void;
	showPublishDialog: boolean;
	setShowPublishDialog: (v: boolean) => void;
	showUnsavedBeforePublish: boolean;
	setShowUnsavedBeforePublish: (v: boolean) => void;
	showConfirmDiscard: boolean;
	setShowConfirmDiscard: (v: boolean) => void;

	// Action callbacks
	onSaveDraft: () => Promise<void> | void;
	onPublish: () => Promise<void> | void;
	onMarkComplete?: () => void;
	onUnpublish?: () => void;
	onDeleteDraft?: () => void;
	onDiscardChanges?: () => void;
	flushAllEditors: () => void;
	handleSaveAndProceedToPublish: () => Promise<void>;
}

export function SessionAgendaPanelDialogs({
	selectedSession,
	showMarkCompleteDialog,
	setShowMarkCompleteDialog,
	showUnpublishDialog,
	setShowUnpublishDialog,
	showDeleteDialog,
	setShowDeleteDialog,
	showSaveDraftDialog,
	setShowSaveDraftDialog,
	showPublishDialog,
	setShowPublishDialog,
	showUnsavedBeforePublish,
	setShowUnsavedBeforePublish,
	showConfirmDiscard,
	setShowConfirmDiscard,
	onSaveDraft,
	onPublish,
	onMarkComplete,
	onUnpublish,
	onDeleteDraft,
	onDiscardChanges,
	flushAllEditors,
	handleSaveAndProceedToPublish,
}: SessionAgendaPanelDialogsProps) {
	return (
		<>
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
		</>
	);
}
