"use client";

import type { SessionManagementSession as SessionUI } from "@repo/shared";
import { SessionStatus } from "@repo/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";
import { useDraftStore } from "@/stores";
import { UseAgendaBuilderReturn } from "./use-agenda-builder";
import type {
	AttachedDocument,
	CustomTextItem,
} from "./use-agenda-builder.types";

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
		customTextsBySection,
		agendaItemOrder,
		hasChanges,
		setContentTextMap,
		setDocumentsByAgendaItem,
		setCustomTextsBySection,
		buildAgendaItems,
		snapshotSavedState,
		snapshotWithOverrides,
		resetEditorState,
		loadEditorState,
		normalizeMap,
		savedContentTextRef,
		savedDocsByAgendaRef,
		savedCustomTextsRef,
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
	/** IDs (doc or custom-text) currently mid-remove on a scheduled session. */
	const [removingItemIds, setRemovingItemIds] = useState<Set<string>>(
		new Set(),
	);

	// Guard so the sync effect doesn't run while the server load is in progress
	const isLoadingRef = useRef(false);

	/**
	 * Wrapper that flags a pending save when docs change on a scheduled session.
	 * Draft persistence is handled entirely by the debounced effect below —
	 * no inline saveDraft call here to avoid stale-closure bugs when multiple
	 * documents are added to a section in rapid succession.
	 */
	const handleDocumentsChange = useCallback(
		(docs: Record<string, AttachedDocument[]>) => {
			setDocumentsByAgendaItem(docs);
			const session = sessions.find((s) => s.id === selectedSession);
			if (session?.status === SessionStatus.SCHEDULED) {
				setPendingSaveForScheduled(true);
			}
		},
		[sessions, selectedSession, setDocumentsByAgendaItem],
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
					const newCustomTexts: Record<string, CustomTextItem[]> = {};

					// Sort by DB orderIndex so docs + custom texts load in their true saved order
					const sorted = [...data.agendaItems].sort(
						(a, b) => a.orderIndex - b.orderIndex,
					);

					for (const agendaItem of sorted) {
						const sectionKey = agendaItem.section;

						if (agendaItem.document) {
							// ── Linked document ──────────────────────────────────────────
							const docs = newDocsByAgenda[sectionKey] || [];
							docs.push({
								id: agendaItem.document.id,
								codeNumber: agendaItem.document.codeNumber,
								title: agendaItem.document.title,
								summary: agendaItem.contentText ?? undefined,
								classification: agendaItem.document.classification ?? undefined,
								// Carry the DB orderIndex — shared namespace with custom texts
								orderIndex: agendaItem.orderIndex,
							});
							newDocsByAgenda[sectionKey] = docs;
						} else if (
							// ── Custom text item ─────────────────────────────────────────
							// Detect via the isCustomText flag (set by adminGetById) OR by
							// the <!--classification:--> marker we embed in contentText for
							// committee custom texts — whichever the API returns.
							(agendaItem.isCustomText ||
								agendaItem.contentText?.startsWith("<!--classification:")) &&
							agendaItem.contentText
						) {
							const existing = newCustomTexts[sectionKey] || [];
							// Strip the encoded classification marker before loading into the editor.
							const classificationMarkerMatch = agendaItem.contentText.match(
								/^<!--classification:(.*?)-->/,
							);
							const cleanContent = agendaItem.contentText.replace(
								/^<!--classification:.*?-->/,
								"",
							);
							const inferredClassification =
								classificationMarkerMatch?.[1] ??
								agendaItem.classification ??
								undefined;
							existing.push({
								id: agendaItem.id,
								content: cleanContent,
								classification: inferredClassification,
								orderIndex: agendaItem.orderIndex,
							});
							newCustomTexts[sectionKey] = existing;
						} else if (agendaItem.contentText) {
							// ── Plain section text (minutes, header text, etc.) ──────────
							// Overwrite is intentional — section text is a single value per section.
							// Guard: if contentText contains HTML tags it is almost certainly a
							// custom text item whose isCustomText flag was not returned by the API
							// (e.g. older saved data). Treat it as a custom text so it doesn't
							// bleed into the minutes picker preview.
							const looksLikeHtml = /<[a-z][\s\S]*>/i.test(
								agendaItem.contentText,
							);
							if (looksLikeHtml) {
								const existing = newCustomTexts[sectionKey] || [];
								existing.push({
									id: agendaItem.id,
									content: agendaItem.contentText,
									classification: agendaItem.classification ?? undefined,
									orderIndex: agendaItem.orderIndex,
								});
								newCustomTexts[sectionKey] = existing;
							} else {
								newContentTextMap[sectionKey] = agendaItem.contentText;
							}
						}
					}

					setContentTextMap(newContentTextMap);
					setDocumentsByAgendaItem(newDocsByAgenda);
					setCustomTextsBySection(newCustomTexts);

					// Snapshot the saved state for dirty-tracking
					savedContentTextRef.current = normalizeMap(newContentTextMap);
					savedDocsByAgendaRef.current = normalizeMap(newDocsByAgenda);
					savedCustomTextsRef.current = normalizeMap(newCustomTexts);
					savedAgendaOrderRef.current = JSON.stringify(defaultOrder);
				}

				// Silently restore any local unsaved draft on top of server state
				const localDraft = getDraft(sessionId);
				if (localDraft) {
					loadEditorState(
						localDraft.contentTextMap,
						localDraft.documentsByAgendaItem,
						localDraft.agendaItemOrder,
						localDraft.customTextsBySection,
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
			setCustomTextsBySection,
			normalizeMap,
			savedContentTextRef,
			savedDocsByAgendaRef,
			savedCustomTextsRef,
			savedAgendaOrderRef,
			defaultOrder,
			getDraft,
			loadEditorState,
		],
	);

	// Persist unsaved changes to localStorage; clear when no changes remain.
	// Debounced by 300 ms so that rapid multi-doc additions (which trigger many
	// sequential state updates) only flush once everything has settled — preventing
	// stale intermediate snapshots from being written to the draft store.
	useEffect(() => {
		if (!selectedSession || isLoadingRef.current) return;

		if (!hasChanges) {
			// No unsaved changes — remove any stale draft so a refresh stays clean.
			clearDraft(selectedSession);
			return;
		}

		// Capture a fresh snapshot into the closure right now (not stale).
		const snapshot = {
			contentTextMap,
			documentsByAgendaItem,
			agendaItemOrder,
			customTextsBySection,
		};

		const timer = setTimeout(() => {
			saveDraft(selectedSession, snapshot);
		}, 300);

		return () => clearTimeout(timer);
	}, [
		hasChanges,
		selectedSession,
		contentTextMap,
		documentsByAgendaItem,
		customTextsBySection,
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
				// Snapshot current state so hasChanges → false and no unsaved banner shows.
				snapshotSavedState();
				clearDraft(selectedSession);
				toast.success("Changes saved.");
			}
		};
		save();
	}, [
		pendingSaveForScheduled,
		selectedSession,
		buildAgendaItems,
		snapshotSavedState,
		clearDraft,
	]);

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
	}, [
		selectedSession,
		buildAgendaItems,
		invalidateSessions,
		snapshotSavedState,
		clearDraft,
	]);

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

	/** Non-optimistic remove for a document on a scheduled session. Saves to server first; applies state only on success. */
	const handleScheduledRemoveDocument = useCallback(
		async (agendaItemId: string, documentId: string) => {
			if (!selectedSession) return;

			// Count total items across the entire session — block removal only if it's the very last one
			const totalDocsInSession = Object.values(documentsByAgendaItem).reduce(
				(sum, docs) => sum + docs.length,
				0,
			);
			const totalCustomTextsInSession = Object.values(
				customTextsBySection,
			).reduce((sum, texts) => sum + texts.length, 0);
			const totalItemsInSession =
				totalDocsInSession + totalCustomTextsInSession;
			if (totalItemsInSession <= 1) {
				toast.error("At least one item must remain in the session.");
				return;
			}

			setRemovingItemIds((prev) => new Set([...prev, documentId]));

			const newDocs = {
				...documentsByAgendaItem,
				[agendaItemId]: (documentsByAgendaItem[agendaItemId] ?? []).filter(
					(d) => d.id !== documentId,
				),
			};

			try {
				const [err] = await api.sessions.saveDraft({
					id: selectedSession,
					agendaItems: buildAgendaItems({ docs: newDocs }),
				});
				if (err) {
					toast.error("Failed to remove item. Please try again.");
				} else {
					// Apply state change only after server confirms success
					setDocumentsByAgendaItem(newDocs);
					// Snapshot with the new docs so hasChanges is immediately false
					snapshotWithOverrides({ docs: newDocs });
					clearDraft(selectedSession);
					toast.success("Removed successfully.");
				}
			} catch {
				toast.error("Failed to remove item. Please try again.");
			} finally {
				setRemovingItemIds((prev) => {
					const next = new Set(prev);
					next.delete(documentId);
					return next;
				});
			}
		},
		[
			selectedSession,
			documentsByAgendaItem,
			buildAgendaItems,
			setDocumentsByAgendaItem,
			snapshotWithOverrides,
			clearDraft,
		],
	);

	/** Remove a custom text item. Draft: immediate. Scheduled: non-optimistic, saves to server first. */
	const handleRemoveCustomText = useCallback(
		async (sectionId: string, itemId: string) => {
			const session = sessions.find((s) => s.id === selectedSession);

			if (session?.status !== SessionStatus.SCHEDULED) {
				// Draft or other statuses: just remove from state immediately
				builder.removeCustomText(sectionId, itemId);
				return;
			}

			// Scheduled: non-optimistic path
			if (!selectedSession) return;

			// Block removal only if this is the very last item across the entire session
			const totalDocsInSession = Object.values(documentsByAgendaItem).reduce(
				(sum, docs) => sum + docs.length,
				0,
			);
			const totalCustomTextsInSession = Object.values(
				customTextsBySection,
			).reduce((sum, texts) => sum + texts.length, 0);
			const totalItemsInSession =
				totalDocsInSession + totalCustomTextsInSession;
			if (totalItemsInSession <= 1) {
				toast.error("At least one item must remain in the session.");
				return;
			}

			setRemovingItemIds((prev) => new Set([...prev, itemId]));

			const currentItems = customTextsBySection[sectionId] ?? [];
			const newCustomTexts = {
				...customTextsBySection,
				[sectionId]: currentItems
					.filter((i) => i.id !== itemId)
					.map((i, idx) => ({ ...i, orderIndex: idx })),
			};

			try {
				const [err] = await api.sessions.saveDraft({
					id: selectedSession,
					agendaItems: buildAgendaItems({ customTexts: newCustomTexts }),
				});
				if (err) {
					toast.error("Failed to remove item. Please try again.");
				} else {
					setCustomTextsBySection(newCustomTexts);
					snapshotWithOverrides({ customTexts: newCustomTexts });
					clearDraft(selectedSession);
					toast.success("Removed successfully.");
				}
			} catch {
				toast.error("Failed to remove item. Please try again.");
			} finally {
				setRemovingItemIds((prev) => {
					const next = new Set(prev);
					next.delete(itemId);
					return next;
				});
			}
		},
		[
			sessions,
			selectedSession,
			builder,
			customTextsBySection,
			buildAgendaItems,
			setCustomTextsBySection,
			snapshotWithOverrides,
			clearDraft,
		],
	);

	return {
		actionInFlight,
		isRemovingPdf,
		isLoadingSession,
		removingItemIds,
		handleSessionChange,
		handleDocumentsChange,
		handleScheduledRemoveDocument,
		handleRemoveCustomText,
		handleSaveDraft,
		handlePublish,
		handleUnpublish,
		handleDeleteDraft,
		handleRemoveAgendaPdf,
		handleMarkComplete,
	};
}

export type UseSessionActionsReturn = ReturnType<typeof useSessionActions>;
