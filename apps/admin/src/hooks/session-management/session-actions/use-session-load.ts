"use client";

import { isDefinedError } from "@orpc/client";
import type { AgendaDocument, CustomTextItem } from "@repo/shared";
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

	const [isLoadingSession, setIsLoadingSession] = useState(false);
	const [sessionLoadError, setSessionLoadError] = useState<string | null>(null);

	// Exposed so the draft-persist effect can guard against running mid-load
	const isLoadingRef = useRef(false);

	const handleSessionChange = useCallback(
		async (sessionId: string): Promise<void> => {
			setIsLoadingSession(true);
			setSessionLoadError(null);
			isLoadingRef.current = true;
			resetEditorState();

			try {
				const [err, data] = await api.sessions.adminGetById({ id: sessionId });

				if (err) {
					const message = isDefinedError(err)
						? err.message
						: "Failed to load session data. Please try again.";
					setSessionLoadError(message);
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

	return {
		isLoadingSession,
		sessionLoadError,
		isLoadingRef,
		handleSessionChange,
	};
}
