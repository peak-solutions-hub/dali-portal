"use client";

import { AgendaDocument, CustomTextItem } from "@repo/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** How long (ms) a draft survives without being touched before it is pruned. */
const DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionDraft {
	contentTextMap: Record<string, string>;
	documentsByAgendaItem: Record<string, AgendaDocument[]>;
	agendaItemOrder: string[];
	customTextsBySection: Record<string, CustomTextItem[]>;
	/** Unix timestamp (ms) of when the draft was last written. */
	savedAt: number;
}

interface DraftStore {
	drafts: Record<string, SessionDraft>;
	/** The ID of the session the admin was last editing. Restored on page load. */
	lastSessionId: string | null;
	/** Persist the current in-memory state for a given session. */
	saveDraft: (sessionId: string, draft: Omit<SessionDraft, "savedAt">) => void;
	/** Remove a session's local draft (e.g. after a successful server save). */
	clearDraft: (sessionId: string) => void;
	/** Retrieve a session's local draft, or null if none exists. */
	getDraft: (sessionId: string) => SessionDraft | null;
	/** Prune drafts older than DRAFT_EXPIRY_MS. Call once on app boot. */
	clearExpiredDrafts: () => void;
	/** Remember which session the admin last had open. */
	setLastSessionId: (sessionId: string | null) => void;
}

export const useDraftStore = create<DraftStore>()(
	persist(
		(set, get) => ({
			drafts: {},
			lastSessionId: null,

			setLastSessionId: (sessionId) => set({ lastSessionId: sessionId }),

			saveDraft: (sessionId, draft) =>
				set((state) => ({
					drafts: {
						...state.drafts,
						[sessionId]: { ...draft, savedAt: Date.now() },
					},
				})),

			clearDraft: (sessionId) =>
				set((state) => {
					const { [sessionId]: _removed, ...rest } = state.drafts;
					return { drafts: rest };
				}),

			getDraft: (sessionId) => get().drafts[sessionId] ?? null,

			clearExpiredDrafts: () =>
				set((state) => {
					const now = Date.now();
					const valid: Record<string, SessionDraft> = {};
					for (const [id, draft] of Object.entries(state.drafts)) {
						if (now - draft.savedAt < DRAFT_EXPIRY_MS) {
							valid[id] = draft;
						}
					}
					return { drafts: valid };
				}),
		}),
		{
			name: "dali-portal-drafts",
			version: 2,
			migrate: (persistedState: unknown, version: number) => {
				const state = persistedState as {
					drafts?: Record<string, SessionDraft>;
				};
				if (version < 2 && state.drafts) {
					// Backfill customTextsBySection on old drafts
					for (const draft of Object.values(state.drafts)) {
						if (!draft.customTextsBySection) {
							draft.customTextsBySection = {};
						}
					}
				}
				return state;
			},
		},
	),
);
