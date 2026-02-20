"use client";

import type { SessionManagementSession as SessionUI } from "@repo/shared";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";
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
		setContentTextMap,
		setDocumentsByAgendaItem,
		buildAgendaItems,
		snapshotSavedState,
		resetEditorState,
		normalizeMap,
		savedContentTextRef,
		savedDocsByAgendaRef,
		savedAgendaOrderRef,
		defaultOrder,
	} = builder;

	const [actionInFlight, setActionInFlight] = useState<string | null>(null);
	const [isUploadingPdf, setIsUploadingPdf] = useState(false);
	const [isRemovingPdf, setIsRemovingPdf] = useState(false);
	const [isLoadingSession, setIsLoadingSession] = useState(false);
	const [pendingSaveForScheduled, setPendingSaveForScheduled] = useState(false);

	/** Wrapper that flags a pending save when docs change on a scheduled session */
	const handleDocumentsChange = useCallback(
		(docs: Record<string, AttachedDocument[]>) => {
			setDocumentsByAgendaItem(docs);
			const session = sessions.find((s) => s.id === selectedSession);
			if (session?.status === "scheduled") {
				setPendingSaveForScheduled(true);
			}
		},
		[sessions, selectedSession, setDocumentsByAgendaItem],
	);

	/** Load a session's saved agenda data into the builder */
	const handleSessionChange = useCallback(
		async (sessionId: string): Promise<void> => {
			setIsLoadingSession(true);
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
			} finally {
				setIsLoadingSession(false);
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
		],
	);

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

	const handleUploadAgendaPdf = useCallback(
		async (file: File) => {
			if (!selectedSession) return;
			setIsUploadingPdf(true);
			try {
				const [urlErr, urlData] = await api.sessions.getAgendaUploadUrl({
					id: selectedSession,
					fileName: file.name,
				});
				if (urlErr || !urlData) {
					toast.error("Failed to get upload URL. Please try again.");
					return;
				}

				const formData = new FormData();
				formData.append("", file);
				const uploadRes = await fetch(urlData.signedUrl, {
					method: "PUT",
					body: formData,
				});
				if (!uploadRes.ok) {
					toast.error("Failed to upload file. Please try again.");
					return;
				}

				const [saveErr] = await api.sessions.saveAgendaPdf({
					id: selectedSession,
					filePath: urlData.path,
					fileName: file.name,
				});
				if (saveErr) {
					toast.error("Failed to save agenda PDF. Please try again.");
					return;
				}

				toast.success("Agenda PDF uploaded successfully.");
				await invalidateSessions();
			} catch {
				toast.error("Failed to upload agenda PDF. Please try again.");
			} finally {
				setIsUploadingPdf(false);
			}
		},
		[selectedSession, invalidateSessions],
	);

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
		isUploadingPdf,
		isRemovingPdf,
		isLoadingSession,
		handleSessionChange,
		handleDocumentsChange,
		handleSaveDraft,
		handlePublish,
		handleUnpublish,
		handleDeleteDraft,
		handleUploadAgendaPdf,
		handleRemoveAgendaPdf,
		handleMarkComplete,
	};
}

export type UseSessionActionsReturn = ReturnType<typeof useSessionActions>;
