"use client";

import { getSectionLabel } from "@repo/ui/lib/session-ui";
import { useCallback, useMemo, useState } from "react";
import { useAgendaBuild } from "./use-agenda-build";
import type {
	AttachedDocument,
	CustomTextItem,
} from "./use-agenda-builder.types";
import { DEFAULT_AGENDA_ITEMS } from "./use-agenda-builder.types";
import { useCustomTextOperations } from "./use-custom-text-operation";
import { useDirtyTracking } from "./use-dirty-tracking";
import { useDocumentOperations } from "./use-documentary-operation";

export function useAgendaBuilder() {
	const [contentTextMap, setContentTextMap] = useState<Record<string, string>>(
		{},
	);
	const [documentsByAgendaItem, setDocumentsByAgendaItem] = useState<
		Record<string, AttachedDocument[]>
	>({});
	const [customTextsBySection, setCustomTextsBySection] = useState<
		Record<string, CustomTextItem[]>
	>({});
	const [agendaItemOrder, setAgendaItemOrder] = useState<string[]>(
		DEFAULT_AGENDA_ITEMS.map((i) => i.id),
	);
	const [highlightedItemId, setHighlightedItemId] = useState<string | null>(
		null,
	);

	const defaultOrder = useMemo(() => DEFAULT_AGENDA_ITEMS.map((i) => i.id), []);

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

	const dirtyTracking = useDirtyTracking({
		contentTextMap,
		documentsByAgendaItem,
		customTextsBySection,
		agendaItemOrder,
		defaultOrder,
	});

	const documentOps = useDocumentOperations({
		agendaItemOrder,
		documentsByAgendaItem,
		setDocumentsByAgendaItem,
		setCustomTextsBySection,
	});

	const customTextOps = useCustomTextOperations({ setCustomTextsBySection });

	const { isSessionEmpty, buildAgendaItems } = useAgendaBuild({
		contentTextMap,
		documentsByAgendaItem,
		customTextsBySection,
		agendaItemOrder,
		orderedSections: orderedAgendaItems,
	});

	const handleContentTextChange = useCallback(
		(itemId: string, text: string) => {
			setContentTextMap((prev) => ({ ...prev, [itemId]: text }));
		},
		[],
	);

	const resetEditorState = useCallback(() => {
		dirtyTracking.savedContentTextRef.current = "{}";
		dirtyTracking.savedDocsByAgendaRef.current = "{}";
		dirtyTracking.savedCustomTextsRef.current = "{}";
		dirtyTracking.savedAgendaOrderRef.current = JSON.stringify(defaultOrder);
		setContentTextMap({});
		setDocumentsByAgendaItem({});
		setCustomTextsBySection({});
		setAgendaItemOrder(defaultOrder);
		setHighlightedItemId(null);
	}, [defaultOrder, dirtyTracking]);

	const revertToSaved = useCallback(() => {
		const savedContent: Record<string, string> = JSON.parse(
			dirtyTracking.savedContentTextRef.current || "{}",
		);
		const savedDocs: Record<string, AttachedDocument[]> = JSON.parse(
			dirtyTracking.savedDocsByAgendaRef.current || "{}",
		);
		const savedCustom: Record<string, CustomTextItem[]> = JSON.parse(
			dirtyTracking.savedCustomTextsRef.current || "{}",
		);
		const savedOrder: string[] = JSON.parse(
			dirtyTracking.savedAgendaOrderRef.current || "[]",
		);
		setContentTextMap(savedContent);
		setDocumentsByAgendaItem(savedDocs);
		setCustomTextsBySection(savedCustom);
		setAgendaItemOrder(savedOrder.length > 0 ? savedOrder : defaultOrder);
		setHighlightedItemId(null);
		dirtyTracking.setSaveTick((t) => t + 1);
	}, [defaultOrder, dirtyTracking]);

	const loadEditorState = useCallback(
		(
			content: Record<string, string>,
			docs: Record<string, AttachedDocument[]>,
			order: string[],
			customTexts?: Record<string, CustomTextItem[]>,
		) => {
			setContentTextMap(content);
			setDocumentsByAgendaItem(docs);
			if (customTexts) setCustomTextsBySection(customTexts);
			setAgendaItemOrder(order.length > 0 ? order : defaultOrder);
			dirtyTracking.setSaveTick((t) => t + 1);
		},
		[defaultOrder, dirtyTracking],
	);

	return {
		// State
		contentTextMap,
		setContentTextMap,
		documentsByAgendaItem,
		setDocumentsByAgendaItem,
		customTextsBySection,
		setCustomTextsBySection,
		agendaItemOrder,
		highlightedItemId,
		orderedAgendaItems,
		defaultOrder,
		isSessionEmpty,

		// Dirty tracking
		hasChanges: dirtyTracking.hasChanges,
		changedSections: dirtyTracking.changedSections,
		normalizeMap: dirtyTracking.normalizeMap,
		snapshotSavedState: dirtyTracking.snapshotSavedState,
		snapshotWithOverrides: dirtyTracking.snapshotWithOverrides,
		savedContentTextRef: dirtyTracking.savedContentTextRef,
		savedDocsByAgendaRef: dirtyTracking.savedDocsByAgendaRef,
		savedCustomTextsRef: dirtyTracking.savedCustomTextsRef,
		savedAgendaOrderRef: dirtyTracking.savedAgendaOrderRef,

		// Document operations
		handleMoveDocument: documentOps.handleMoveDocument,
		moveDocumentToSection: documentOps.moveDocumentToSection,
		handleDndReorder: documentOps.handleDndReorder,
		handleMixedDndReorder: documentOps.handleMixedDndReorder,
		writeCommitteeState: documentOps.writeCommitteeState,
		isDocumentFirstGlobal: documentOps.isDocumentFirstGlobal,
		isDocumentLastGlobal: documentOps.isDocumentLastGlobal,

		// Custom text operations
		addCustomText: customTextOps.addCustomText,
		updateCustomText: customTextOps.updateCustomText,
		removeCustomText: customTextOps.removeCustomText,
		reorderCustomTexts: customTextOps.reorderCustomTexts,
		moveCustomTextToSection: useCallback(
			(
				sourceSectionId: string,
				sourceIndex: number,
				destSectionId: string,
				targetClassification?: string,
			) => {
				customTextOps.moveCustomTextToSection(
					sourceSectionId,
					sourceIndex,
					destSectionId,
				);
				// If a targetClassification was specified (e.g. dropping into a committee group),
				// apply it to the moved item after the move settles.
				if (targetClassification) {
					setCustomTextsBySection((prev) => {
						const destItems = [...(prev[destSectionId] ?? [])];
						// The moved item is appended at the end by moveCustomTextToSection
						const lastIdx = destItems.length - 1;
						if (lastIdx < 0) return prev;
						return {
							...prev,
							[destSectionId]: destItems.map((item, i) =>
								i === lastIdx
									? { ...item, classification: targetClassification }
									: item,
							),
						};
					});
				}
			},
			[customTextOps, setCustomTextsBySection],
		),

		// Build / lifecycle
		buildAgendaItems,
		handleContentTextChange,
		resetEditorState,
		revertToSaved,
		loadEditorState,
	};
}

export type UseAgendaBuilderReturn = ReturnType<typeof useAgendaBuilder>;
