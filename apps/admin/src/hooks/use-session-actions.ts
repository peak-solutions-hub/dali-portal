"use client";

import type { SessionManagementSession as SessionUI } from "@repo/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";
import { useDraftStore } from "@/stores";
import type {
	AttachedDocument,
	UseAgendaBuilderReturn,
} from "./use-agenda-builder";

export interface UseSessionActionsOptions {
	selectedSession: string | null;
	sessions: SessionUI[];
	builder: UseAgendaBuilderReturn;
	invalidateSessions: () => Promise<void>;
}

/**
 * Hook that manages all session mutation actions: save, publish, unpublish,
 * delete, mark complete, upload/remove PDF, session change, and auto-save.
 */
export function useSessionActions({
	selectedSession,
	sessions,
	builder,
	invalidateSessions,
}: UseSessionActionsOptions) {
	const {
		contentTextMap,
		documentsByAgendaItem,
		agendaItemOrder,
		hasChanges,
		setContentTextMap,
		setDocumentsByAgendaItem,
		buildAgendaItems,
		snapshotSavedState,
		resetEditorState,
		loadEditorState,
		normalizeMap,
		savedContentTextRef,
		savedDocsByAgendaRef,
		savedAgendaOrderRef,
		defaultOrder,
	} = builder;

	// --- Draft-store selectors (stable refs, no re-render) ---
	const saveDraft = useDraftStore((s) => s.saveDraft);
	const clearDraft = useDraftStore((s) => s.clearDraft);
	const getDraft = useDraftStore((s) => s.getDraft);

	const [actionInFlight, setActionInFlight] = useState<string | null>(null);
	const [isRemovingPdf, setIsRemovingPdf] = useState(false);
	const [isLoadingSession, setIsLoadingSession] = useState(false);
	const [pendingSaveForScheduled, setPendingSaveForScheduled] = useState(false);

	// Guard so the sync effect doesn't run while the server load is in progress
	const isLoadingRef = useRef(false);

	/** Wrapper that flags a pending save when docs change on a scheduled session */
	const handleDocumentsChange = useCallback(
		(docs: Record<string, AttachedDocument[]>) => {
			setDocumentsByAgendaItem(docs);
			const session = sessions.find((s) => s.id === selectedSession);
			if (session?.status === "scheduled") {
				setPendingSaveForScheduled(true);
			}
			// Immediately sync the updated docs to localStorage so that a refresh
			// after a document removal doesn't restore the stale (pre-removal) draft.
			if (selectedSession) {
				saveDraft(selectedSession, {
					contentTextMap,
					documentsByAgendaItem: docs,
					agendaItemOrder,
				});
			}
		},
		[
			sessions,
			selectedSession,
			setDocumentsByAgendaItem,
			saveDraft,
			contentTextMap,
			agendaItemOrder,
		],
	);

	/** Load a session's saved agenda data into the builder */
	const handleSessionChange = useCallback(
		async (sessionId: string): Promise<void> => {
			setIsLoadingSession(true);
			isLoadingRef.current = true;
			resetEditorState();

			try {
				const [err, data] = await api.sessions.adminGetById({ id: sessionId });
				if (!err && data && data.agendaItems.length > 0) {
					const newContentTextMap: Record<string, string> = {};
					const newDocsByAgenda: Record<string, AttachedDocument[]> = {};

					for (const agendaItem of data.agendaItems) {
						const sectionKey = agendaItem.section;

						if (agendaItem.document) {
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
							newContentTextMap[sectionKey] = agendaItem.contentText;
						}
					}

					setContentTextMap(newContentTextMap);
					setDocumentsByAgendaItem(newDocsByAgenda);

					// Snapshot the saved state for dirty-tracking
					savedContentTextRef.current = normalizeMap(newContentTextMap);
					savedDocsByAgendaRef.current = normalizeMap(newDocsByAgenda);
					savedAgendaOrderRef.current = JSON.stringify(defaultOrder);
				}

				// Silently restore any local unsaved draft on top of server state
				const localDraft = getDraft(sessionId);
				if (localDraft) {
					loadEditorState(
						localDraft.contentTextMap,
						localDraft.documentsByAgendaItem,
						localDraft.agendaItemOrder,
					);
				}
			} finally {
				setIsLoadingSession(false);
				isLoadingRef.current = false;
			}
		},
		[
			resetEditorState,
			setContentTextMap,
			setDocumentsByAgendaItem,
			normalizeMap,
			savedContentTextRef,
			savedDocsByAgendaRef,
			savedAgendaOrderRef,
			defaultOrder,
			getDraft,
		],
	);

	// -----------------------------------------------------------------------
	// Persist unsaved changes to localStorage while the user is editing.
	// - When hasChanges is true: write the current state to the draft store.
	// - When hasChanges is false: clear the draft so a stale entry never gets
	//   restored on refresh (e.g. user reverts a custom minutes date back to None).
	// -----------------------------------------------------------------------
	useEffect(() => {
		if (!selectedSession || isLoadingRef.current) return;
		if (hasChanges) {
			saveDraft(selectedSession, {
				contentTextMap,
				documentsByAgendaItem,
				agendaItemOrder,
			});
		} else {
			// No unsaved changes — remove any stale draft so a refresh stays clean.
			clearDraft(selectedSession);
		}
	}, [
		hasChanges,
		selectedSession,
		contentTextMap,
		documentsByAgendaItem,
		agendaItemOrder,
		saveDraft,
		clearDraft,
	]);

	// Auto-save agenda when docs change on a scheduled session
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
			} else {
				toast.success("Changes saved.");
			}
		};
		save();
	}, [pendingSaveForScheduled, selectedSession, buildAgendaItems]);

	const handleSaveDraft = useCallback(async () => {
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
				snapshotSavedState();
				if (selectedSession) clearDraft(selectedSession);
				toast.success("Draft saved successfully.");
				await invalidateSessions();
			}
		} catch {
			toast.error("Failed to save draft. Please try again.");
		} finally {
			setActionInFlight(null);
		}
	}, [
		selectedSession,
		buildAgendaItems,
		snapshotSavedState,
		invalidateSessions,
	]);

	const handlePublish = useCallback(async () => {
		if (!selectedSession) return;
		setActionInFlight("publishing");
		try {
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
				snapshotSavedState();
				if (selectedSession) clearDraft(selectedSession);
				toast.success("Session published successfully.");
				await invalidateSessions();
			}
		} catch {
			toast.error("Failed to publish session. Please try again.");
		} finally {
			setActionInFlight(null);
		}
	}, [selectedSession, buildAgendaItems, invalidateSessions]);

	const handleUnpublish = useCallback(async () => {
		if (!selectedSession) return;
		setActionInFlight("unpublishing");
		try {
			const [err] = await api.sessions.unpublish({ id: selectedSession });
			if (err) {
				toast.error("Failed to unpublish session. Please try again.");
			} else {
				toast.success("Session unpublished.");
				await invalidateSessions();
			}
		} catch {
			toast.error("Failed to unpublish session. Please try again.");
		} finally {
			setActionInFlight(null);
		}
	}, [selectedSession, invalidateSessions]);

	const handleDeleteDraft = useCallback(async (): Promise<boolean> => {
		if (!selectedSession) return false;
		setActionInFlight("deleting");
		try {
			const [err] = await api.sessions.delete({ id: selectedSession });
			if (err) {
				toast.error("Failed to delete session. Please try again.");
				return false;
			}
			toast.success("Draft deleted.");
			clearDraft(selectedSession);
			resetEditorState();
			await invalidateSessions();
			return true;
		} catch {
			toast.error("Failed to delete session. Please try again.");
			return false;
		} finally {
			setActionInFlight(null);
		}
	}, [selectedSession, resetEditorState, invalidateSessions]);

	// handleUploadAgendaPdf removed — upload is now handled entirely inside
	// AgendaPdfUpload component using useSupabaseUpload + direct API calls.
	// The component calls onUploadSuccess (= invalidateSessions) when done.

	const handleRemoveAgendaPdf = useCallback(async () => {
		if (!selectedSession) return;
		setIsRemovingPdf(true);
		try {
			const [err] = await api.sessions.removeAgendaPdf({
				id: selectedSession,
			});
			if (err) {
				toast.error("Failed to remove agenda PDF. Please try again.");
			} else {
				toast.success("Agenda PDF removed.");
				await invalidateSessions();
			}
		} catch {
			toast.error("Failed to remove agenda PDF. Please try again.");
		} finally {
			setIsRemovingPdf(false);
		}
	}, [selectedSession, invalidateSessions]);

	const handleMarkComplete = useCallback(async () => {
		if (!selectedSession) return;
		setActionInFlight("completing");
		try {
			const [err] = await api.sessions.markComplete({ id: selectedSession });
			if (err) {
				toast.error("Failed to mark session complete. Please try again.");
			} else {
				toast.success("Session marked as completed.");
				await invalidateSessions();
			}
		} catch {
			toast.error("Failed to mark session complete. Please try again.");
		} finally {
			setActionInFlight(null);
		}
	}, [selectedSession, invalidateSessions]);

	return {
		actionInFlight,
		isRemovingPdf,
		isLoadingSession,
		handleSessionChange,
		handleDocumentsChange,
		handleSaveDraft,
		handlePublish,
		handleUnpublish,
		handleDeleteDraft,
		handleRemoveAgendaPdf,
		handleMarkComplete,
	};
}

export type UseSessionActionsReturn = ReturnType<typeof useSessionActions>;
