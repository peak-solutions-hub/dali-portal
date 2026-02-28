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

				const newItem: CustomTextItem = {
					id,
					content: "",
					classification,
					orderIndex: withoutEmpties.length,
				};
				return {
					...prev,
					[sectionId]: [...withoutEmpties, newItem].map((item, idx) => ({
						...item,
						orderIndex: idx,
					})),
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
				return {
					...prev,
					[sectionId]: existing
						.filter((item) => item.id !== itemId)
						.map((item, idx) => ({ ...item, orderIndex: idx })),
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
		(sourceSectionId: string, sourceIndex: number, destSectionId: string) => {
			setCustomTextsBySection((prev) => {
				const sourceItems = [...(prev[sourceSectionId] ?? [])];
				if (sourceIndex < 0 || sourceIndex >= sourceItems.length) return prev;
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
