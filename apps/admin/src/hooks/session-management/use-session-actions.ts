"use client";

import type { SessionManagementSession as SessionUI } from "@repo/shared";
import {
	useScheduledRemove,
	useSessionDraftPersist,
	useSessionLoad,
	useSessionMutations,
} from "./session-actions";
import type { UseAgendaBuilderReturn } from "./use-agenda-builder";

export interface UseSessionActionsOptions {
	selectedSession: string | null;
	sessions: SessionUI[];
	builder: UseAgendaBuilderReturn;
	invalidateSessions: () => Promise<void>;
}

/**
 * Composes the four session-action sub-hooks into one cohesive interface.
 * The public return surface is identical to the original monolithic hook
 * so all consumers continue to work without changes.
 *
 * Sub-hooks:
 *   use-session-load          — fetch server state + restore local draft
 *   use-session-draft-persist — debounced localStorage + scheduled auto-save
 *   use-session-mutations     — save, publish, unpublish, delete, complete, PDF
 *   use-scheduled-remove      — non-optimistic item removal for scheduled sessions
 */
export function useSessionActions({
	selectedSession,
	sessions,
	builder,
	invalidateSessions,
}: UseSessionActionsOptions) {
	const {
		isLoadingSession,
		sessionLoadError,
		isLoadingRef,
		handleSessionChange,
	} = useSessionLoad({ builder });

	const { handleDocumentsChange } = useSessionDraftPersist({
		selectedSession,
		sessions,
		builder,
		isLoadingRef,
	});

	const {
		actionInFlight,
		isRemovingPdf,
		handleSaveDraft,
		handlePublish,
		handleUnpublish,
		handleDeleteDraft,
		handleMarkComplete,
		handleRemoveAgendaPdf,
	} = useSessionMutations({
		selectedSession,
		builder,
		invalidateSessions,
		reloadSession: async () => {
			if (selectedSession) await handleSessionChange(selectedSession);
		},
	});

	const {
		removingItemIds,
		handleScheduledRemoveDocument,
		handleRemoveCustomText,
	} = useScheduledRemove({ selectedSession, sessions, builder });

	return {
		// State
		actionInFlight,
		isRemovingPdf,
		isLoadingSession,
		sessionLoadError,
		removingItemIds,

		// Handlers
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
