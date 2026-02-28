import { useCallback, useRef, useState } from "react";

/**
 * Owns every dialog visibility flag and the cross-card editor-flush mechanism.
 * Extracted from AgendaPanel so the parent component stays focused on layout.
 */
export function useAgendaPanelDialogs({
	hasChanges,
	onSaveDraft,
}: {
	hasChanges: boolean;
	onSaveDraft: () => Promise<void> | void;
	onPublish: () => Promise<void> | void;
}) {
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

	/** Commit all open editors across every card before saving/publishing. */
	const flushAllEditors = useCallback(() => {
		let hadContent = false;
		for (const ref of cardFlushRefs.current.values()) {
			if (ref.current?.()) hadContent = true;
		}
		activeCardItemId.current = null;
		return hadContent;
	}, []);

	const handlePublishClick = () => {
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

	return {
		// Dialog state
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

		// Editor flush
		flushAllEditors,
		getOrCreateCardFlushRef,
		handleCardEditorOpen,

		// Derived handlers
		handlePublishClick,
		handleSaveAndProceedToPublish,
	};
}
