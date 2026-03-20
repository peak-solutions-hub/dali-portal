"use client";

import { isDefinedError } from "@orpc/client";
import type { SessionManagementSession as SessionUI } from "@repo/shared";
import { SessionStatus } from "@repo/shared";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";
import { useDraftStore } from "@/stores";
import type { UseAgendaBuilderReturn } from "../use-agenda-builder";

interface UseScheduledRemoveOptions {
	selectedSession: string | null;
	sessions: SessionUI[];
	builder: UseAgendaBuilderReturn;
}

/**
 * Non-optimistic removal of documents and custom texts.
 *
 * - Draft sessions: immediate local state removal.
 * - Scheduled sessions: saves to server first, applies state only on success.
 *
 * Tracks in-flight item IDs so the UI can disable Remove buttons globally
 * while any removal is in progress.
 */
export function useScheduledRemove({
	selectedSession,
	sessions,
	builder,
}: UseScheduledRemoveOptions) {
	const {
		documentsByAgendaItem,
		customTextsBySection,
		setDocumentsByAgendaItem,
		setCustomTextsBySection,
		snapshotWithOverrides,
		removeCustomText,
	} = builder;

	const clearDraft = useDraftStore((s) => s.clearDraft);

	const [removingItemIds, setRemovingItemIds] = useState<Set<string>>(
		new Set(),
	);

	const addRemoving = (id: string) =>
		setRemovingItemIds((prev) => new Set([...prev, id]));

	const deleteRemoving = (id: string) =>
		setRemovingItemIds((prev) => {
			const next = new Set(prev);
			next.delete(id);
			return next;
		});

	/** Counts all content items (docs + custom texts) across the entire session. */
	const getTotalItemCount = () => {
		const totalDocs = Object.values(documentsByAgendaItem).reduce(
			(sum, docs) => sum + docs.length,
			0,
		);
		const totalCustom = Object.values(customTextsBySection).reduce(
			(sum, texts) => sum + texts.length,
			0,
		);
		return totalDocs + totalCustom;
	};

	const handleScheduledRemoveDocument = useCallback(
		async (agendaItemId: string, documentId: string) => {
			if (!selectedSession) return;

			if (getTotalItemCount() <= 1) {
				toast.error("At least one item must remain in the session.");
				return;
			}

			// Resolve the DB agenda item row ID stored on the document by use-session-load.
			const doc = (documentsByAgendaItem[agendaItemId] ?? []).find(
				(d) => d.id === documentId,
			);
			if (!doc?.agendaItemId) {
				toast.error("Cannot remove item: agenda item ID not found.");
				return;
			}

			addRemoving(documentId);

			try {
				const [err] = await api.sessions.removeAgendaItem({
					sessionId: selectedSession,
					agendaItemId: doc.agendaItemId,
				});
				if (err) {
					toast.error(
						isDefinedError(err)
							? err.message
							: "Failed to remove item. Please try again.",
					);
				} else {
					const newDocs = {
						...documentsByAgendaItem,
						[agendaItemId]: (documentsByAgendaItem[agendaItemId] ?? []).filter(
							(d) => d.id !== documentId,
						),
					};
					setDocumentsByAgendaItem(newDocs);
					snapshotWithOverrides({ docs: newDocs });
					clearDraft(selectedSession);
					toast.success("Removed successfully.");
				}
			} catch {
				toast.error("Failed to remove item. Please try again.");
			} finally {
				deleteRemoving(documentId);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			selectedSession,
			documentsByAgendaItem,
			setDocumentsByAgendaItem,
			snapshotWithOverrides,
			clearDraft,
		],
	);

	const handleRemoveCustomText = useCallback(
		async (sectionId: string, itemId: string) => {
			const session = sessions.find((s) => s.id === selectedSession);

			// Draft (or any non-scheduled) session: remove immediately from local state
			if (session?.status !== SessionStatus.SCHEDULED) {
				removeCustomText(sectionId, itemId);
				return;
			}

			// Scheduled: non-optimistic path — itemId IS the DB agenda item row ID
			// (set by use-session-load: id: agendaItem.id)
			if (!selectedSession) return;

			if (getTotalItemCount() <= 1) {
				toast.error("At least one item must remain in the session.");
				return;
			}

			addRemoving(itemId);

			try {
				const [err] = await api.sessions.removeAgendaItem({
					sessionId: selectedSession,
					agendaItemId: itemId,
				});
				if (err) {
					toast.error(
						isDefinedError(err)
							? err.message
							: "Failed to remove item. Please try again.",
					);
				} else {
					const currentItems = customTextsBySection[sectionId] ?? [];
					const newCustomTexts = {
						...customTextsBySection,
						[sectionId]: currentItems
							.filter((i) => i.id !== itemId)
							.map((i, idx) => ({ ...i, orderIndex: idx })),
					};
					setCustomTextsBySection(newCustomTexts);
					snapshotWithOverrides({ customTexts: newCustomTexts });
					clearDraft(selectedSession);
					toast.success("Removed successfully.");
				}
			} catch {
				toast.error("Failed to remove item. Please try again.");
			} finally {
				deleteRemoving(itemId);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			sessions,
			selectedSession,
			customTextsBySection,
			setCustomTextsBySection,
			snapshotWithOverrides,
			clearDraft,
			removeCustomText,
		],
	);

	return {
		removingItemIds,
		handleScheduledRemoveDocument,
		handleRemoveCustomText,
	};
}
