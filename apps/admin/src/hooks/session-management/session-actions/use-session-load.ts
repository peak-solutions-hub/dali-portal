"use client";

import { isDefinedError } from "@orpc/client";
import {
	type AgendaDocument,
	type CustomTextItem,
	SessionStatus,
} from "@repo/shared";
import { isNetworkError } from "@repo/ui/lib/is-network-error";
import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api.client";
import { useDraftStore } from "@/stores";
import type { UseAgendaBuilderReturn } from "../use-agenda-builder";

interface UseSessionLoadOptions {
	builder: UseAgendaBuilderReturn;
}

/**
 * Handles loading a session's saved agenda from the server into the builder,
 * then overlaying any locally-persisted unsaved draft on top.
 */
export function useSessionLoad({ builder }: UseSessionLoadOptions) {
	const {
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
		loadEditorState,
	} = builder;

	const getDraft = useDraftStore((s) => s.getDraft);
	const clearDraft = useDraftStore((s) => s.clearDraft);

	const [isLoadingSession, setIsLoadingSession] = useState(false);
	const [sessionLoadError, setSessionLoadError] = useState<string | null>(null);
	const [sessionLoadErrorIsNetwork, setSessionLoadErrorIsNetwork] =
		useState(false);

	// Exposed so the draft-persist effect can guard against running mid-load
	const isLoadingRef = useRef(false);
	const loadRequestIdRef = useRef(0);
	const hydratedSessionIdRef = useRef<string | null>(null);

	type SessionDetailData = Awaited<
		ReturnType<typeof api.sessions.adminGetById>
	>[1];

	const resolveLoadErrorMessage = (error: unknown): string => {
		if (error instanceof Error) {
			if (isNetworkError(error)) {
				return "Unable to reach the server. Please check your connection and try again.";
			}

			return error.message || "Failed to load session data. Please try again.";
		}

		return "Failed to load session data. Please try again.";
	};

	const handleSessionChange = useCallback(
		async (
			sessionId: string,
			preloadedData?: SessionDetailData,
		): Promise<void> => {
			const requestId = ++loadRequestIdRef.current;
			const isLatestRequest = () => loadRequestIdRef.current === requestId;
			const shouldShowLoadingState = !preloadedData;
			hydratedSessionIdRef.current = null;

			setIsLoadingSession(shouldShowLoadingState);
			setSessionLoadError(null);
			setSessionLoadErrorIsNetwork(false);
			isLoadingRef.current = true;
			resetEditorState();

			try {
				let data = preloadedData;

				if (!data) {
					const [err, fetchedData] = await api.sessions.adminGetById({
						id: sessionId,
					});

					if (!isLatestRequest()) {
						return;
					}

					if (err) {
						const message = isDefinedError(err)
							? err.message
							: "Failed to load session data. Please try again.";
						setSessionLoadError(message);
						setSessionLoadErrorIsNetwork(false);
						return;
					}

					data = fetchedData;
				}

				if (!isLatestRequest()) {
					return;
				}

				if (!data) {
					setSessionLoadError("Failed to load session data. Please try again.");
					setSessionLoadErrorIsNetwork(false);
					return;
				}

				if (data && data.agendaItems.length > 0) {
					const newContentTextMap: Record<string, string> = {};
					const newDocsByAgenda: Record<string, AgendaDocument[]> = {};
					const newCustomTexts: Record<string, CustomTextItem[]> = {};

					// Sort by DB orderIndex so items load in their true saved order
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
								// Carry the DB agenda item row ID for scheduled-session removal
								agendaItemId: agendaItem.id,
							});
							newDocsByAgenda[sectionKey] = docs;
						} else if (
							// ── Custom text item ─────────────────────────────────────────
							// Detect via the isCustomText flag OR by the <!--classification:-->
							// marker we embed in contentText for committee custom texts.
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
							// Guard: if contentText contains HTML it is almost certainly a
							// custom text item whose isCustomText flag was not returned by
							// the API (older saved data). Treat it as a custom text.
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

				const localDraft = getDraft(sessionId);

				// Only draft sessions should restore local unsaved drafts.
				// Scheduled/completed sessions can carry stale local drafts from older edits,
				// which incorrectly marks the loaded session as "unsaved changes".
				if (data.status === SessionStatus.DRAFT) {
					if (localDraft) {
						loadEditorState(
							localDraft.contentTextMap,
							localDraft.documentsByAgendaItem,
							localDraft.agendaItemOrder,
							localDraft.customTextsBySection,
						);
					}
				} else if (localDraft) {
					clearDraft(sessionId);
				}

				hydratedSessionIdRef.current = sessionId;
			} catch (error) {
				if (!isLatestRequest()) {
					return;
				}

				hydratedSessionIdRef.current = null;

				setSessionLoadErrorIsNetwork(
					error instanceof Error && isNetworkError(error),
				);
				setSessionLoadError(resolveLoadErrorMessage(error));
			} finally {
				if (isLatestRequest()) {
					setIsLoadingSession(false);
					isLoadingRef.current = false;
				}
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
			clearDraft,
			loadEditorState,
		],
	);

	return {
		isLoadingSession,
		sessionLoadError,
		sessionLoadErrorIsNetwork,
		isLoadingRef,
		hydratedSessionIdRef,
		handleSessionChange,
	};
}
