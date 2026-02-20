"use client";

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

	/**
	 * Move a document UP or DOWN across sections.
	 *
	 * Within the same section the document simply swaps position with its
	 * neighbour.  When it is already at the edge of a section it transfers
	 * to the adjacent section (previous for "up", next for "down").
	 *
	 * Duplicate handling:
	 *   If the target section already contains the same document the move
	 *   is skipped (no duplicate created).
	 *
	 * After every move every affected section is renumbered starting from 1.
	 *
	 * Sections themselves are NEVER reordered — only items within sections.
	 */
	const handleMoveDocument = useCallback(
		(documentId: string, direction: "up" | "down") => {
			setDocumentsByAgendaItem((prev) => {
				// Step 1 — locate the document in the ordered section list
				let sourceSectionId: string | null = null;
				let sourceIndex = -1;

				for (const sectionId of agendaItemOrder) {
					const docs = prev[sectionId] ?? [];
					const idx = docs.findIndex((d) => d.id === documentId);
					if (idx !== -1) {
						sourceSectionId = sectionId;
						sourceIndex = idx;
						break;
					}
				}

				if (!sourceSectionId || sourceIndex === -1) return prev;

				const sourceDocs = [...(prev[sourceSectionId] ?? [])];
				const sectionIdx = agendaItemOrder.indexOf(sourceSectionId);

				// Step 2 — try intra-section swap first
				if (direction === "up" && sourceIndex > 0) {
					// Swap with previous document in the same section
					const temp = sourceDocs[sourceIndex]!;
					sourceDocs[sourceIndex] = sourceDocs[sourceIndex - 1]!;
					sourceDocs[sourceIndex - 1] = temp;
					return { ...prev, [sourceSectionId]: sourceDocs };
				}

				if (direction === "down" && sourceIndex < sourceDocs.length - 1) {
					// Swap with next document in the same section
					const temp = sourceDocs[sourceIndex]!;
					sourceDocs[sourceIndex] = sourceDocs[sourceIndex + 1]!;
					sourceDocs[sourceIndex + 1] = temp;
					return { ...prev, [sourceSectionId]: sourceDocs };
				}

				// Step 3 — cross-section transfer
				// Find the adjacent section, skipping sections that already contain
				// this document (duplicate handling).
				const step = direction === "up" ? -1 : 1;
				let targetSectionId: string | null = null;

				for (
					let i = sectionIdx + step;
					i >= 0 && i < agendaItemOrder.length;
					i += step
				) {
					const candidateId = agendaItemOrder[i]!;
					const candidateDocs = prev[candidateId] ?? [];
					// Skip if the candidate already has this document
					if (candidateDocs.some((d) => d.id === documentId)) continue;
					targetSectionId = candidateId;
					break;
				}

				if (!targetSectionId) return prev; // nowhere to move

				// Step 4 — remove from source, insert into target
				const movedDoc = sourceDocs[sourceIndex]!;
				const newSourceDocs = sourceDocs.filter((_, i) => i !== sourceIndex);
				const targetDocs = [...(prev[targetSectionId] ?? [])];

				if (direction === "up") {
					// Insert at the bottom of the previous section
					targetDocs.push(movedDoc);
				} else {
					// Insert at the top of the next section
					targetDocs.unshift(movedDoc);
				}

				// Step 5 — return updated map (positions are implicit via array index)
				return {
					...prev,
					[sourceSectionId]: newSourceDocs,
					[targetSectionId]: targetDocs,
				};
			});
		},
		[agendaItemOrder],
	);

	/**
	 * Move a document to a specific target section, optionally inserting it
	 * before an existing document in that section.
	 *
	 * Cross-section duplicate handling:
	 *   Any copy of the document that exists in sections between the source
	 *   and target (inclusive of source) is removed so the document ends up
	 *   in the target section only.
	 *
	 * @param documentId           The document to move
	 * @param targetSectionId      The section to move into
	 * @param insertBeforeDocId    (optional) Place the document before this
	 *                             document in the target section.  If omitted
	 *                             the document is appended at the end.
	 *
	 * Example usage:
	 *   // Move DOC-001 from Section A → Section C, insert before DOC-005
	 *   moveDocumentToSection("doc-001", "committee_reports", "doc-005")
	 *
	 *   // Move, skip duplicate in Section B automatically
	 *   moveDocumentToSection("doc-001", "third_reading_of_ordinances")
	 */
	const moveDocumentToSection = useCallback(
		(
			documentId: string,
			targetSectionId: string,
			insertBeforeDocId?: string,
		) => {
			setDocumentsByAgendaItem((prev) => {
				// Step 1 — find the document data from any section
				let movedDoc: AttachedDocument | null = null;
				for (const sectionId of agendaItemOrder) {
					const doc = (prev[sectionId] ?? []).find((d) => d.id === documentId);
					if (doc) {
						movedDoc = doc;
						break;
					}
				}
				if (!movedDoc) return prev; // document not found anywhere

				// Step 2 — remove the document from ALL sections (cleans duplicates)
				const next: Record<string, AttachedDocument[]> = {};
				for (const sectionId of agendaItemOrder) {
					next[sectionId] = (prev[sectionId] ?? []).filter(
						(d) => d.id !== documentId,
					);
				}

				// Step 3 — insert into the target section
				const targetDocs = [...(next[targetSectionId] ?? [])];

				if (insertBeforeDocId) {
					// Insert before the specified document
					const insertIdx = targetDocs.findIndex(
						(d) => d.id === insertBeforeDocId,
					);
					if (insertIdx !== -1) {
						targetDocs.splice(insertIdx, 0, movedDoc);
					} else {
						// Fallback: append if the "before" doc wasn't found
						targetDocs.push(movedDoc);
					}
				} else {
					// Append at the end
					targetDocs.push(movedDoc);
				}

				next[targetSectionId] = targetDocs;

				// Positions are renumbered implicitly (array index = position)
				return next;
			});
		},
		[agendaItemOrder],
	);

	/**
	 * Check if a document cannot move UP any further.
	 *
	 * True when the document is the first item in the first section AND
	 * there is no empty (or non-duplicate) section above it to transfer to.
	 */
	const isDocumentFirstGlobal = useCallback(
		(documentId: string): boolean => {
			// Locate the document
			let sourceSectionIdx = -1;
			let sourceDocIdx = -1;

			for (let i = 0; i < agendaItemOrder.length; i++) {
				const sectionId = agendaItemOrder[i]!;
				const docs = documentsByAgendaItem[sectionId] ?? [];
				const idx = docs.findIndex((d) => d.id === documentId);
				if (idx !== -1) {
					sourceSectionIdx = i;
					sourceDocIdx = idx;
					break;
				}
			}

			if (sourceSectionIdx === -1) return true; // not found

			// If it is not the first doc in its section it can always swap up
			if (sourceDocIdx > 0) return false;

			// It is the first doc in its section — check for any valid section above
			for (let i = sourceSectionIdx - 1; i >= 0; i--) {
				const sectionId = agendaItemOrder[i]!;
				const docs = documentsByAgendaItem[sectionId] ?? [];
				// Skip sections that already contain this document (duplicate)
				if (docs.some((d) => d.id === documentId)) continue;
				return false; // found a valid target above
			}

			return true; // nowhere to go
		},
		[agendaItemOrder, documentsByAgendaItem],
	);

	/**
	 * Check if a document cannot move DOWN any further.
	 *
	 * True when the document is the last item in its section AND
	 * there is no valid (non-duplicate) section below it.
	 */
	const isDocumentLastGlobal = useCallback(
		(documentId: string): boolean => {
			let sourceSectionIdx = -1;
			let sourceDocIdx = -1;
			let sourceSectionLength = 0;

			for (let i = 0; i < agendaItemOrder.length; i++) {
				const sectionId = agendaItemOrder[i]!;
				const docs = documentsByAgendaItem[sectionId] ?? [];
				const idx = docs.findIndex((d) => d.id === documentId);
				if (idx !== -1) {
					sourceSectionIdx = i;
					sourceDocIdx = idx;
					sourceSectionLength = docs.length;
					break;
				}
			}

			if (sourceSectionIdx === -1) return true; // not found

			// If it is not the last doc in its section it can always swap down
			if (sourceDocIdx < sourceSectionLength - 1) return false;

			// Last doc in its section — check for any valid section below
			for (let i = sourceSectionIdx + 1; i < agendaItemOrder.length; i++) {
				const sectionId = agendaItemOrder[i]!;
				const docs = documentsByAgendaItem[sectionId] ?? [];
				if (docs.some((d) => d.id === documentId)) continue;
				return false; // found a valid target below
			}

			return true; // nowhere to go
		},
		[agendaItemOrder, documentsByAgendaItem],
	);

	/**
	 * Handle a drag-and-drop reorder event.
	 *
	 * @param sourceSectionId  The droppable ID (section) the document was dragged from
	 * @param destSectionId    The droppable ID (section) the document was dropped into
	 * @param sourceIndex      The index within the source section
	 * @param destIndex        The index within the destination section
	 *
	 * Works for both intra-section reorder and cross-section transfer.
	 * Renumbering is implicit (array index = position).
	 */
	const handleDndReorder = useCallback(
		(
			sourceSectionId: string,
			destSectionId: string,
			sourceIndex: number,
			destIndex: number,
		) => {
			setDocumentsByAgendaItem((prev) => {
				if (sourceSectionId === destSectionId) {
					// Intra-section reorder
					const docs = [...(prev[sourceSectionId] ?? [])];
					const [moved] = docs.splice(sourceIndex, 1);
					if (!moved) return prev;
					docs.splice(destIndex, 0, moved);
					return { ...prev, [sourceSectionId]: docs };
				}

				// Cross-section transfer
				const sourceDocs = [...(prev[sourceSectionId] ?? [])];
				const destDocs = [...(prev[destSectionId] ?? [])];
				const [moved] = sourceDocs.splice(sourceIndex, 1);
				if (!moved) return prev;

				// Prevent duplicates in destination
				if (destDocs.some((d) => d.id === moved.id)) return prev;

				destDocs.splice(destIndex, 0, moved);
				return {
					...prev,
					[sourceSectionId]: sourceDocs,
					[destSectionId]: destDocs,
				};
			});
		},
		[],
	);

	/**
	 * Whether the session is "empty" — no documents attached and no content text
	 * in any section.  Used to disable publish when there is nothing to publish.
	 */
	const isSessionEmpty = useMemo(() => {
		const hasAnyContent = Object.values(contentTextMap).some(
			(v) => typeof v === "string" && v.trim().length > 0,
		);
		const hasAnyDocs = Object.values(documentsByAgendaItem).some(
			(docs) => Array.isArray(docs) && docs.length > 0,
		);
		return !hasAnyContent && !hasAnyDocs;
	}, [contentTextMap, documentsByAgendaItem]);

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

	/**
	 * Revert all in-memory edits back to the last-saved snapshot.
	 * Useful as a "Discard Changes" action.
	 */
	const revertToSaved = useCallback(() => {
		const savedContent: Record<string, string> = JSON.parse(
			savedContentTextRef.current || "{}",
		);
		const savedDocs: Record<string, AttachedDocument[]> = JSON.parse(
			savedDocsByAgendaRef.current || "{}",
		);
		const savedOrder: string[] = JSON.parse(
			savedAgendaOrderRef.current || "[]",
		);

		setContentTextMap(savedContent);
		setDocumentsByAgendaItem(savedDocs);
		setAgendaItemOrder(savedOrder.length > 0 ? savedOrder : defaultOrder);
		setHighlightedItemId(null);
		setSaveTick((t) => t + 1);
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
		isSessionEmpty,
		defaultOrder,

		// Handlers
		handleContentTextChange,
		handleMoveDocument,
		handleDndReorder,
		moveDocumentToSection,
		isDocumentFirstGlobal,
		isDocumentLastGlobal,
		resetEditorState,
		revertToSaved,
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
