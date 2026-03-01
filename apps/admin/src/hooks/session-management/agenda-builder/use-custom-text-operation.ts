import { CustomTextItem } from "@repo/shared";
import { useCallback } from "react";

export function useCustomTextOperations({
	setCustomTextsBySection,
}: {
	setCustomTextsBySection: React.Dispatch<
		React.SetStateAction<Record<string, CustomTextItem[]>>
	>;
}) {
	const addCustomText = useCallback(
		(sectionId: string, classification?: string) => {
			const id = crypto.randomUUID();
			setCustomTextsBySection((prev) => {
				const existing = prev[sectionId] ?? [];

				// Silently discard any empty items in the same section+classification
				// before adding the new one. An empty item has no value so nothing is lost.
				const withoutEmpties = existing.filter((item) => {
					const isEmpty =
						!item.content ||
						item.content.replace(/<[^>]*>/g, "").trim().length === 0;
					if (!isEmpty) return true;
					// For committee reports, only discard empties in the same classification group
					if (sectionId === "committee_reports") {
						return (
							(item.classification ?? "uncategorized") !==
							(classification ?? "uncategorized")
						);
					}
					return false;
				});

				// Preserve existing items' orderIndex to avoid false dirty-tracking
				// positives. Items loaded from the server carry a global orderIndex
				// (shared with documents); re-indexing would change them and make
				// the dirty tracker think there are unsaved changes.
				const maxOrder = withoutEmpties.reduce(
					(max, item) => Math.max(max, item.orderIndex ?? 0),
					-1,
				);

				const newItem: CustomTextItem = {
					id,
					content: "",
					classification,
					orderIndex: maxOrder + 1,
				};
				return {
					...prev,
					[sectionId]: [...withoutEmpties, newItem],
				};
			});
			return id;
		},
		[setCustomTextsBySection],
	);

	const updateCustomText = useCallback(
		(sectionId: string, itemId: string, content: string) => {
			setCustomTextsBySection((prev) => {
				const existing = prev[sectionId] ?? [];
				return {
					...prev,
					[sectionId]: existing.map((item) =>
						item.id === itemId ? { ...item, content } : item,
					),
				};
			});
		},
		[setCustomTextsBySection],
	);

	const removeCustomText = useCallback(
		(sectionId: string, itemId: string) => {
			setCustomTextsBySection((prev) => {
				const existing = prev[sectionId] ?? [];
				// Don't re-index remaining items — their orderIndex values may
				// come from the server (global agenda ordering). Re-indexing would
				// change them and trigger false dirty-tracking positives.
				return {
					...prev,
					[sectionId]: existing.filter((item) => item.id !== itemId),
				};
			});
		},
		[setCustomTextsBySection],
	);

	const reorderCustomTexts = useCallback(
		(
			sectionId: string,
			sourceIndex: number,
			destIndex: number,
			classification?: string,
		) => {
			setCustomTextsBySection((prev) => {
				const all = prev[sectionId] ?? [];
				const isCommittee = sectionId === "committee_reports";

				if (isCommittee) {
					const groupClassification =
						classification ??
						all[sourceIndex]?.classification ??
						"uncategorized";
					const groupItems = all.filter(
						(i) =>
							(i.classification ?? "uncategorized") === groupClassification,
					);
					const otherItems = all.filter(
						(i) =>
							(i.classification ?? "uncategorized") !== groupClassification,
					);
					const clampedDest = Math.max(
						0,
						Math.min(destIndex, groupItems.length - 1),
					);
					const [moved] = groupItems.splice(sourceIndex, 1);
					if (!moved) return prev;
					groupItems.splice(clampedDest, 0, moved);
					const reindexed = [...otherItems, ...groupItems].map((item, idx) => ({
						...item,
						orderIndex: idx,
					}));
					return { ...prev, [sectionId]: reindexed };
				}

				const items = [...all];
				const clampedDest = Math.max(0, Math.min(destIndex, items.length - 1));
				const [moved] = items.splice(sourceIndex, 1);
				if (!moved) return prev;
				items.splice(clampedDest, 0, moved);
				return {
					...prev,
					[sectionId]: items.map((item, idx) => ({ ...item, orderIndex: idx })),
				};
			});
		},
		[setCustomTextsBySection],
	);

	const moveCustomTextToSection = useCallback(
		(sourceSectionId: string, itemId: string, destSectionId: string) => {
			setCustomTextsBySection((prev) => {
				const sourceItems = [...(prev[sourceSectionId] ?? [])];
				const sourceIndex = sourceItems.findIndex((c) => c.id === itemId);
				if (sourceIndex === -1) return prev;
				const [moved] = sourceItems.splice(sourceIndex, 1);
				if (!moved) return prev;
				const destItems = [...(prev[destSectionId] ?? [])];
				destItems.push({
					...moved,
					classification: undefined,
					orderIndex: destItems.length,
				});
				return {
					...prev,
					[sourceSectionId]: sourceItems.map((i, idx) => ({
						...i,
						orderIndex: idx,
					})),
					[destSectionId]: destItems,
				};
			});
		},
		[setCustomTextsBySection],
	);

	return {
		addCustomText,
		updateCustomText,
		removeCustomText,
		reorderCustomTexts,
		moveCustomTextToSection,
	};
}
