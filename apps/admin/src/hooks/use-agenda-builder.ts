"use client";

import type { SessionManagementSession as SessionUI } from "@repo/shared";
import {
	getSectionLabel,
	SESSION_SECTION_ORDER,
} from "@repo/ui/lib/session-ui";
import { useCallback, useMemo, useRef, useState } from "react";

// Re-export for consumers
export interface AttachedDocument {
	id: string;
	key: string;
	title: string;
	summary?: string;
	classification?: string;
}

// Dynamically generate agenda items from the session section enum
const DEFAULT_AGENDA_ITEMS = SESSION_SECTION_ORDER.map((section, index) => ({
	id: section,
	title: `${String.fromCharCode(65 + index)}. ${getSectionLabel(section)
		.replace(/\s+of:$/, "")
		.replace(/:$/, "")}`,
	section,
	orderIndex: index,
}));

export type AgendaItem = (typeof DEFAULT_AGENDA_ITEMS)[number];

export interface BuildAgendaItem {
	section: string;
	orderIndex: number;
	contentText?: string | null;
	linkedDocument?: string | null;
}

/**
 * Hook that manages all agenda-builder state: content text, documents per section,
 * item ordering, dirty tracking with per-section change indicators, and reset/build logic.
 */
export function useAgendaBuilder() {
	const [contentTextMap, setContentTextMap] = useState<Record<string, string>>(
		{},
	);
	const [documentsByAgendaItem, setDocumentsByAgendaItem] = useState<
		Record<string, AttachedDocument[]>
	>({});
	const [agendaItemOrder, setAgendaItemOrder] = useState<string[]>(
		DEFAULT_AGENDA_ITEMS.map((i) => i.id),
	);
	const [highlightedItemId, setHighlightedItemId] = useState<string | null>(
		null,
	);

	// Dirty-tracking: snapshots of the last-saved state
	const savedContentTextRef = useRef<string>("{}");
	const savedDocsByAgendaRef = useRef<string>("{}");
	const savedAgendaOrderRef = useRef<string>(
		JSON.stringify(DEFAULT_AGENDA_ITEMS.map((i) => i.id)),
	);

	// Counter to force hasChanges recomputation after saving
	const [_saveTick, setSaveTick] = useState(0);

	const defaultOrder = useMemo(() => DEFAULT_AGENDA_ITEMS.map((i) => i.id), []);

	/** Normalise a map by stripping empty/falsy values so {} matches {key: ''} */
	const normalizeMap = useCallback((map: Record<string, unknown>) => {
		const cleaned: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(map)) {
			if (
				v !== "" &&
				v !== undefined &&
				v !== null &&
				!(Array.isArray(v) && v.length === 0)
			) {
				cleaned[k] = v;
			}
		}
		return JSON.stringify(cleaned);
	}, []);

	/** Compute whether the editor has unsaved changes compared to last saved snapshot */
	const hasChanges = useMemo(() => {
		const currentContent = normalizeMap(contentTextMap);
		const currentDocs = normalizeMap(documentsByAgendaItem);
		const currentOrder = JSON.stringify(agendaItemOrder);
		return (
			currentContent !== savedContentTextRef.current ||
			currentDocs !== savedDocsByAgendaRef.current ||
			currentOrder !== savedAgendaOrderRef.current
		);
	}, [
		contentTextMap,
		documentsByAgendaItem,
		agendaItemOrder,
		normalizeMap,
		_saveTick,
	]);

	/** Compute per-section change indicators for visual feedback */
	const changedSections = useMemo<Set<string>>(() => {
		const changed = new Set<string>();

		const savedContent: Record<string, unknown> = JSON.parse(
			savedContentTextRef.current || "{}",
		);
		const savedDocs: Record<string, unknown> = JSON.parse(
			savedDocsByAgendaRef.current || "{}",
		);

		// Check each section for content text changes
		const allSectionIds = new Set([
			...Object.keys(contentTextMap),
			...Object.keys(savedContent),
		]);
		for (const sectionId of allSectionIds) {
			const currentVal = contentTextMap[sectionId] ?? "";
			const savedVal = (savedContent[sectionId] as string) ?? "";
			if (currentVal !== savedVal) {
				changed.add(sectionId);
			}
		}

		// Check each section for document changes
		const allDocSectionIds = new Set([
			...Object.keys(documentsByAgendaItem),
			...Object.keys(savedDocs),
		]);
		for (const sectionId of allDocSectionIds) {
			const currentDocs = documentsByAgendaItem[sectionId] ?? [];
			const savedSectionDocs = savedDocs[sectionId];
			if (
				JSON.stringify(currentDocs) !== JSON.stringify(savedSectionDocs ?? [])
			) {
				changed.add(sectionId);
			}
		}

		// Check if order changed — mark all sections when order changes
		const savedOrder = JSON.parse(savedAgendaOrderRef.current || "[]");
		if (JSON.stringify(agendaItemOrder) !== JSON.stringify(savedOrder)) {
			for (const id of agendaItemOrder) {
				changed.add(id);
			}
		}

		return changed;
	}, [contentTextMap, documentsByAgendaItem, agendaItemOrder, _saveTick]);

	const handleContentTextChange = useCallback(
		(itemId: string, text: string) => {
			setContentTextMap((prev) => ({ ...prev, [itemId]: text }));
		},
		[],
	);

	/** Move an agenda item up or down */
	const handleMoveAgendaItem = useCallback(
		(itemId: string, direction: "up" | "down") => {
			setAgendaItemOrder((prev) => {
				const idx = prev.indexOf(itemId);
				if (idx === -1) return prev;
				const swapIdx = direction === "up" ? idx - 1 : idx + 1;
				if (swapIdx < 0 || swapIdx >= prev.length) return prev;
				const next = [...prev];
				const temp = next[idx]!;
				next[idx] = next[swapIdx]!;
				next[swapIdx] = temp;
				return next;
			});
			setHighlightedItemId(itemId);
			setTimeout(() => setHighlightedItemId(null), 800);
		},
		[],
	);

	// Re-order DEFAULT_AGENDA_ITEMS based on agendaItemOrder
	const orderedAgendaItems = useMemo(() => {
		return agendaItemOrder
			.map((id, idx) => {
				const item = DEFAULT_AGENDA_ITEMS.find((ai) => ai.id === id);
				if (!item) return null;
				const letter = String.fromCharCode(65 + idx);
				return {
					...item,
					title: `${letter}. ${getSectionLabel(item.section)
						.replace(/\s+of:$/, "")
						.replace(/:$/, "")}`,
					orderIndex: idx,
				};
			})
			.filter(Boolean) as typeof DEFAULT_AGENDA_ITEMS;
	}, [agendaItemOrder]);

	const resetEditorState = useCallback(() => {
		savedContentTextRef.current = "{}";
		savedDocsByAgendaRef.current = "{}";
		savedAgendaOrderRef.current = JSON.stringify(defaultOrder);
		setContentTextMap({});
		setDocumentsByAgendaItem({});
		setAgendaItemOrder(defaultOrder);
		setHighlightedItemId(null);
	}, [defaultOrder]);

	/** Build the agenda items array for API submission */
	const buildAgendaItems = useCallback((): BuildAgendaItem[] => {
		const agendaItems: BuildAgendaItem[] = [];
		let orderIdx = 0;

		for (const item of DEFAULT_AGENDA_ITEMS) {
			const sectionDocs = documentsByAgendaItem[item.id] || [];
			const sectionContentText = contentTextMap[item.id] || null;

			if (sectionDocs.length === 0) {
				agendaItems.push({
					section: item.section,
					orderIndex: orderIdx++,
					contentText: sectionContentText,
					linkedDocument: null,
				});
			} else {
				if (sectionContentText) {
					agendaItems.push({
						section: item.section,
						orderIndex: orderIdx++,
						contentText: sectionContentText,
						linkedDocument: null,
					});
				}
				for (const doc of sectionDocs) {
					agendaItems.push({
						section: item.section,
						orderIndex: orderIdx++,
						contentText: doc.summary || null,
						linkedDocument: doc.id,
					});
				}
			}
		}
		return agendaItems;
	}, [documentsByAgendaItem, contentTextMap]);

	/** Snapshot the current state as the "saved" baseline for dirty tracking */
	const snapshotSavedState = useCallback(() => {
		savedContentTextRef.current = normalizeMap(contentTextMap);
		savedDocsByAgendaRef.current = normalizeMap(documentsByAgendaItem);
		savedAgendaOrderRef.current = JSON.stringify(agendaItemOrder);
		setSaveTick((t) => t + 1);
	}, [normalizeMap, contentTextMap, documentsByAgendaItem, agendaItemOrder]);

	return {
		// State
		contentTextMap,
		setContentTextMap,
		documentsByAgendaItem,
		setDocumentsByAgendaItem,
		agendaItemOrder,
		highlightedItemId,
		hasChanges,
		changedSections,
		orderedAgendaItems,
		defaultOrder,

		// Handlers
		handleContentTextChange,
		handleMoveAgendaItem,
		resetEditorState,
		buildAgendaItems,
		snapshotSavedState,

		// Snapshot internals (for session load)
		normalizeMap,
		savedContentTextRef,
		savedDocsByAgendaRef,
		savedAgendaOrderRef,
	};
}

export type UseAgendaBuilderReturn = ReturnType<typeof useAgendaBuilder>;
