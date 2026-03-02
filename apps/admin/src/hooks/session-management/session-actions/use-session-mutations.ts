"use client";

import { isDefinedError } from "@orpc/client";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";
import { useDraftStore } from "@/stores";
import type { UseAgendaBuilderReturn } from "../use-agenda-builder";

interface UseSessionMutationsOptions {
	selectedSession: string | null;
	builder: UseAgendaBuilderReturn;
	invalidateSessions: () => Promise<void>;
	/**
	 * Reloads the current session from the server so in-memory docs get their
	 * server-assigned agendaItemId fields populated. Must be called after any
	 * status transition (publish / unpublish) to keep removal working without
	 * a full browser refresh.
	 */
	reloadSession: () => Promise<void>;
}

/**
 * Manages all server-mutating session actions:
 * save draft, publish, unpublish, delete, mark complete, remove agenda PDF.
 */
export function useSessionMutations({
	selectedSession,
	builder,
	invalidateSessions,
	reloadSession,
}: UseSessionMutationsOptions) {
	const { buildAgendaItems, snapshotSavedState, resetEditorState } = builder;

	const clearDraft = useDraftStore((s) => s.clearDraft);

	const [actionInFlight, setActionInFlight] = useState<string | null>(null);
	const [isRemovingPdf, setIsRemovingPdf] = useState(false);

	const handleSaveDraft = useCallback(async () => {
		if (!selectedSession) return;
		setActionInFlight("saving");
		try {
			const [err] = await api.sessions.saveDraft({
				id: selectedSession,
				agendaItems: buildAgendaItems(),
			});
			if (err) {
				toast.error(
					isDefinedError(err)
						? err.message
						: "Failed to save draft. Please try again.",
				);
			} else {
				snapshotSavedState();
				clearDraft(selectedSession);
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
		clearDraft,
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
				toast.error(
					isDefinedError(saveErr)
						? saveErr.message
						: "Failed to save before publishing. Please try again.",
				);
				setActionInFlight(null);
				return;
			}
			const [err] = await api.sessions.publish({ id: selectedSession });
			if (err) {
				toast.error(
					isDefinedError(err)
						? err.message
						: "Failed to publish session. Please try again.",
				);
			} else {
				snapshotSavedState();
				clearDraft(selectedSession);
				toast.success("Session published successfully.");
				await invalidateSessions();
				// Reload the session so in-memory docs get their server-assigned
				// agendaItemId. Without this, removal fails until a browser refresh.
				await reloadSession();
			}
		} catch {
			toast.error("Failed to publish session. Please try again.");
		} finally {
			setActionInFlight(null);
		}
	}, [
		selectedSession,
		buildAgendaItems,
		snapshotSavedState,
		invalidateSessions,
		reloadSession,
		clearDraft,
	]);

	const handleUnpublish = useCallback(async () => {
		if (!selectedSession) return;
		setActionInFlight("unpublishing");
		try {
			const [err] = await api.sessions.unpublish({ id: selectedSession });
			if (err) {
				toast.error(
					isDefinedError(err)
						? err.message
						: "Failed to unpublish session. Please try again.",
				);
			} else {
				toast.success("Session unpublished.");
				await invalidateSessions();
				// Reload so agendaItemId fields stay consistent after status change.
				await reloadSession();
			}
		} catch {
			toast.error("Failed to unpublish session. Please try again.");
		} finally {
			setActionInFlight(null);
		}
	}, [selectedSession, invalidateSessions, reloadSession]);

	const handleDeleteDraft = useCallback(async (): Promise<boolean> => {
		if (!selectedSession) return false;
		setActionInFlight("deleting");
		try {
			const [err] = await api.sessions.delete({ id: selectedSession });
			if (err) {
				toast.error(
					isDefinedError(err)
						? err.message
						: "Failed to delete session. Please try again.",
				);
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
	}, [selectedSession, resetEditorState, invalidateSessions, clearDraft]);

	const handleMarkComplete = useCallback(async () => {
		if (!selectedSession) return;
		setActionInFlight("completing");
		try {
			const [err] = await api.sessions.markComplete({ id: selectedSession });
			if (err) {
				toast.error(
					isDefinedError(err)
						? err.message
						: "Failed to mark session complete. Please try again.",
				);
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

	const handleRemoveAgendaPdf = useCallback(async () => {
		if (!selectedSession) return;
		setIsRemovingPdf(true);
		try {
			const [err] = await api.sessions.removeAgendaPdf({ id: selectedSession });
			if (err) {
				toast.error(
					isDefinedError(err)
						? err.message
						: "Failed to remove agenda PDF. Please try again.",
				);
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

	return {
		actionInFlight,
		isRemovingPdf,
		handleSaveDraft,
		handlePublish,
		handleUnpublish,
		handleDeleteDraft,
		handleMarkComplete,
		handleRemoveAgendaPdf,
	};
}
