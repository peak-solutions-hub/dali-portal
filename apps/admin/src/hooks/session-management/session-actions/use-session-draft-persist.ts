"use client";

import type {
	AgendaDocument,
	SessionManagementSession as SessionUI,
} from "@repo/shared";
import { SessionStatus } from "@repo/shared";
import type { MutableRefObject } from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";
import { useDraftStore } from "@/stores";
import type { UseAgendaBuilderReturn } from "../use-agenda-builder";

interface UseSessionDraftPersistOptions {
	selectedSession: string | null;
	sessions: SessionUI[];
	builder: UseAgendaBuilderReturn;
	isLoadingRef: MutableRefObject<boolean>;
}

/**
 * Two responsibilities:
 * 1. Debounced localStorage draft persistence — writes unsaved changes every
 *    300 ms, clears when changes are gone.
 * 2. Auto-save to server when documents change on a *scheduled* session.
 *    `handleDocumentsChange` sets the pending flag; the effect fires the save.
 */
export function useSessionDraftPersist({
	selectedSession,
	sessions,
	builder,
	isLoadingRef,
}: UseSessionDraftPersistOptions) {
	const {
		contentTextMap,
		documentsByAgendaItem,
		customTextsBySection,
		agendaItemOrder,
		hasChanges,
		setDocumentsByAgendaItem,
		buildAgendaItems,
		snapshotSavedState,
	} = builder;

	const saveDraft = useDraftStore((s) => s.saveDraft);
	const clearDraft = useDraftStore((s) => s.clearDraft);

	const [pendingSaveForScheduled, setPendingSaveForScheduled] = useState(false);

	// ── 1. Debounced localStorage persistence ────────────────────────────────
	useEffect(() => {
		if (!selectedSession || isLoadingRef.current) return;

		if (!hasChanges) {
			clearDraft(selectedSession);
			return;
		}

		// Strip empty custom-text placeholder items before persisting the draft
		// so they never reappear as phantom "unsaved" editor boxes on page reload.
		const filteredCustomTexts = Object.fromEntries(
			Object.entries(customTextsBySection)
				.map(([k, items]) => [
					k,
					items.filter(
						(item) =>
							typeof item.content === "string" &&
							item.content.replace(/<[^>]*>/g, "").trim().length > 0,
					),
				])
				.filter(([, items]) => (items as unknown[]).length > 0),
		);
		const snapshot = {
			contentTextMap,
			documentsByAgendaItem,
			agendaItemOrder,
			customTextsBySection: filteredCustomTexts,
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
		isLoadingRef,
	]);

	// ── 2. Auto-save to server on scheduled session doc changes ──────────────
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

	/**
	 * Drop-in replacement for setDocumentsByAgendaItem that also flags a pending
	 * auto-save when the current session is scheduled.
	 */
	const handleDocumentsChange = useCallback(
		(docs: Record<string, AgendaDocument[]>) => {
			setDocumentsByAgendaItem(docs);
			const session = sessions.find((s) => s.id === selectedSession);
			if (session?.status === SessionStatus.SCHEDULED) {
				setPendingSaveForScheduled(true);
			}
		},
		[sessions, selectedSession, setDocumentsByAgendaItem],
	);

	return { handleDocumentsChange };
}
