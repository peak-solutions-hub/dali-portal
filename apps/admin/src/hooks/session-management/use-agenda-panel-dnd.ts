import type { DropResult } from "@hello-pangea/dnd";
import type { SessionManagementAgendaItem } from "@repo/shared";
import { AgendaDocument, CustomTextItem } from "@repo/shared";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseAgendaPanelDndOptions {
	agendaItems: SessionManagementAgendaItem[];
	documentsByAgendaItem: Record<string, AgendaDocument[]>;
	customTextsBySection?: Record<string, CustomTextItem[]>;
	onDndReorder?: (
		sourceSectionId: string,
		destSectionId: string,
		sourceIndex: number,
		destIndex: number,
	) => void;
	onMixedDndReorder?: (
		sectionId: string,
		sourceIndex: number,
		destIndex: number,
		docs: AgendaDocument[],
		customs: CustomTextItem[],
	) => void;
	onWriteCommitteeState?: (
		sectionId: string,
		newDocs: AgendaDocument[],
		newCustoms: CustomTextItem[],
	) => void;
	onCommitteeDocClassify?: (
		docId: string,
		sourceSectionId: string,
		sourceIndex: number,
		destSectionId: string,
		destIndex: number,
		targetClassification: string,
	) => void;
	onReorderCustomTexts?: (
		sectionId: string,
		sourceIndex: number,
		destIndex: number,
		classification?: string,
	) => void;
	onMoveCustomText?: (
		sourceSectionId: string,
		itemId: string,
		destSectionId: string,
		targetClassification?: string,
	) => void;
}

export function useAgendaPanelDnd({
	agendaItems,
	documentsByAgendaItem,
	customTextsBySection,
	onDndReorder,
	onMixedDndReorder,
	onWriteCommitteeState,
	onCommitteeDocClassify,
	onReorderCustomTexts,
	onMoveCustomText,
}: UseAgendaPanelDndOptions) {
	const [dndError, setDndError] = useState<string | null>(null);
	const dndErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const dismissDndError = useCallback(() => {
		if (dndErrorTimerRef.current) {
			clearTimeout(dndErrorTimerRef.current);
			dndErrorTimerRef.current = null;
		}
		setDndError(null);
	}, []);

	const showDndError = useCallback((message: string) => {
		if (dndErrorTimerRef.current) {
			clearTimeout(dndErrorTimerRef.current);
			dndErrorTimerRef.current = null;
		}
		setDndError(message);
		dndErrorTimerRef.current = setTimeout(() => {
			setDndError(null);
			dndErrorTimerRef.current = null;
		}, 4000);
	}, []);

	useEffect(() => {
		return () => {
			if (dndErrorTimerRef.current) {
				clearTimeout(dndErrorTimerRef.current);
			}
		};
	}, []);

	const handleDragOver = (e: React.DragEvent, _agendaItemId: string) => {
		e.preventDefault();
		e.currentTarget.classList.add("bg-blue-50", "border-blue-300");
	};
	const handleDragLeave = (e: React.DragEvent) => {
		e.currentTarget.classList.remove("bg-blue-50", "border-blue-300");
	};

	// Resolve any droppable ID → { sectionId, classification? }
	const resolveDroppable = (
		id: string,
	): { sectionId: string; classification?: string } => {
		if (id.startsWith("drop-zone::"))
			return { sectionId: id.slice("drop-zone::".length) };
		if (id.startsWith("committee-group::"))
			return {
				sectionId: "committee_reports",
				classification: id.slice("committee-group::".length),
			};
		if (id.startsWith("committee-drop::"))
			return { sectionId: "committee_reports" };
		return { sectionId: id };
	};

	const reorderCommitteeGroup = (
		classification: string,
		sourceIdx: number,
		destIdx: number,
	) => {
		const flatDocs = documentsByAgendaItem["committee_reports"] ?? [];
		const flatCustoms = customTextsBySection?.["committee_reports"] ?? [];

		// ── 1. Reorder items *within* the target classification group ────────
		const groupDocs = flatDocs
			.filter((d) => (d.classification ?? "uncategorized") === classification)
			.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
		const groupCustoms = flatCustoms
			.filter((c) => (c.classification ?? "uncategorized") === classification)
			.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

		type Tagged =
			| { type: "doc"; item: AgendaDocument }
			| { type: "custom"; item: CustomTextItem };

		const unified: Tagged[] = [
			...groupDocs.map((d) => ({ type: "doc" as const, item: d })),
			...groupCustoms.map((c) => ({ type: "custom" as const, item: c })),
		].sort((a, b) => (a.item.orderIndex ?? 0) - (b.item.orderIndex ?? 0));

		const clamped = Math.max(0, Math.min(destIdx, unified.length - 1));
		const [moved] = unified.splice(sourceIdx, 1);
		if (!moved) return;
		unified.splice(clamped, 0, moved);

		// ── 2. Rebuild ALL items globally, preserving classification order ───
		// Collect every classification, ordered by the minimum orderIndex that
		// existed before the reorder. This keeps group ordering stable.
		type AllTagged = Tagged & { cls: string };
		const allTagged: AllTagged[] = [
			...flatDocs.map((d) => ({
				type: "doc" as const,
				item: d,
				cls: (d as AgendaDocument).classification ?? "uncategorized",
			})),
			...flatCustoms.map((c) => ({
				type: "custom" as const,
				item: c,
				cls: (c as CustomTextItem).classification ?? "uncategorized",
			})),
		];

		// Determine original group ordering by minimum orderIndex per classification
		const groupMinOrder = new Map<string, number>();
		for (const t of allTagged) {
			const cur = groupMinOrder.get(t.cls);
			const oi = t.item.orderIndex ?? 0;
			if (cur === undefined || oi < cur) groupMinOrder.set(t.cls, oi);
		}
		const orderedClassifications = [...groupMinOrder.entries()]
			.sort((a, b) => a[1] - b[1])
			.map(([cls]) => cls);

		// For each classification, collect its items in order.
		// The target group uses the reordered `unified`; others keep their
		// existing orderIndex-sorted order.
		const reorderedGroupIds = new Set(unified.map((e) => e.item.id));
		const globalList: Tagged[] = [];
		for (const cls of orderedClassifications) {
			if (cls === classification) {
				// Use the reordered group
				globalList.push(...unified);
			} else {
				// Other groups: gather docs + customs, sort by orderIndex
				const clsDocs = flatDocs
					.filter(
						(d) =>
							(d.classification ?? "uncategorized") === cls &&
							!reorderedGroupIds.has(d.id),
					)
					.map((d) => ({ type: "doc" as const, item: d }));
				const clsCustoms = flatCustoms
					.filter(
						(c) =>
							(c.classification ?? "uncategorized") === cls &&
							!reorderedGroupIds.has(c.id),
					)
					.map((c) => ({ type: "custom" as const, item: c }));
				const clsItems: Tagged[] = [...clsDocs, ...clsCustoms].sort(
					(a, b) => (a.item.orderIndex ?? 0) - (b.item.orderIndex ?? 0),
				);
				globalList.push(...clsItems);
			}
		}

		// ── 3. Assign sequential global orderIndex + split back ──────────────
		const newDocs: AgendaDocument[] = [];
		const newCustoms: CustomTextItem[] = [];
		const seenIds = new Set<string>();
		globalList.forEach((e, i) => {
			if (seenIds.has(e.item.id)) return; // dedup safety net
			seenIds.add(e.item.id);
			if (e.type === "doc")
				newDocs.push({ ...(e.item as AgendaDocument), orderIndex: i });
			else newCustoms.push({ ...(e.item as CustomTextItem), orderIndex: i });
		});

		if (onWriteCommitteeState) {
			onWriteCommitteeState("committee_reports", newDocs, newCustoms);
		} else {
			onMixedDndReorder?.("committee_reports", 0, 0, newDocs, newCustoms);
		}
	};

	const handleDragEnd = (result: DropResult) => {
		const { source, destination, draggableId } = result;
		if (!destination) return;
		if (
			source.droppableId === destination.droppableId &&
			source.index === destination.index
		)
			return;

		// ── Custom text drag ──────────────────────────────────────────────────────
		if (draggableId.startsWith("custom::")) {
			const parts = draggableId.split("::");
			const customSourceIndex = parseInt(parts[2] ?? "0", 10);
			const docCount = parseInt(parts[3] ?? "0", 10);

			const src = resolveDroppable(source.droppableId);
			const dest = resolveDroppable(destination.droppableId);

			if (source.droppableId === destination.droppableId) {
				if (src.classification) {
					reorderCommitteeGroup(
						src.classification,
						source.index,
						destination.index,
					);
				} else if (onMixedDndReorder) {
					onMixedDndReorder(
						src.sectionId,
						source.index,
						destination.index,
						documentsByAgendaItem[src.sectionId] ?? [],
						customTextsBySection?.[src.sectionId] ?? [],
					);
				} else {
					const customDestIndex = Math.max(0, destination.index - docCount);
					onReorderCustomTexts?.(
						src.sectionId,
						customSourceIndex,
						customDestIndex,
					);
				}
				return;
			}

			// Cross-group within committee
			if (
				src.sectionId === "committee_reports" &&
				dest.sectionId === "committee_reports"
			) {
				if (!dest.classification) {
					showDndError("Drop onto a specific committee group to reassign.");
					return;
				}
				const customItemId = parts[parts.length - 1]!;
				const flatDocs = documentsByAgendaItem["committee_reports"] ?? [];
				const flatCustoms = customTextsBySection?.["committee_reports"] ?? [];
				if (!flatCustoms.some((c) => c.id === customItemId)) return;
				const updatedCustoms = flatCustoms.map((c) =>
					c.id === customItemId
						? { ...c, classification: dest.classification }
						: c,
				);
				if (onWriteCommitteeState) {
					onWriteCommitteeState("committee_reports", flatDocs, updatedCustoms);
				} else {
					onMixedDndReorder?.(
						"committee_reports",
						0,
						0,
						flatDocs,
						updatedCustoms,
					);
				}
				return;
			}

			// Any section → committee: require existing groups
			if (dest.sectionId === "committee_reports") {
				const hasExistingGroups =
					(documentsByAgendaItem["committee_reports"] ?? []).length > 0 ||
					(customTextsBySection?.["committee_reports"] ?? []).some(
						(ct) => ct.classification && ct.classification !== "uncategorized",
					);
				if (!hasExistingGroups) {
					showDndError(
						"There are no existing committee classifications to drop into. Add a committee first.",
					);
					return;
				}
				if (!dest.classification) {
					showDndError(
						"Drop onto a specific committee group to assign a classification.",
					);
					return;
				}
			}

			const customItemId = parts[parts.length - 1]!;
			onMoveCustomText?.(
				src.sectionId,
				customItemId,
				dest.sectionId,
				dest.classification,
			);
			return;
		}

		// ── Document drag ─────────────────────────────────────────────────────────
		const docIdParts = draggableId.split("::");
		const docId = docIdParts[docIdParts.length - 1]!;

		const src = resolveDroppable(source.droppableId);
		const dest = resolveDroppable(destination.droppableId);

		// Detect same-section drops — the raw droppableId may differ when the user
		// drops on the drop-zone (`drop-zone::sectionId`) of the same section.
		const isSameSection =
			source.droppableId === destination.droppableId ||
			(src.sectionId === dest.sectionId &&
				!src.classification &&
				!dest.classification);

		if (isSameSection) {
			// When the doc lands on the section's drop-zone (a separate
			// droppable at the bottom) place it at the end of the unified list.
			let effectiveDestIndex: number;
			if (source.droppableId === destination.droppableId) {
				effectiveDestIndex = destination.index;
			} else {
				const totalItems =
					(documentsByAgendaItem[src.sectionId] ?? []).length +
					(customTextsBySection?.[src.sectionId] ?? []).length;
				effectiveDestIndex = totalItems;
			}

			if (source.index === effectiveDestIndex) return;

			if (src.classification) {
				reorderCommitteeGroup(
					src.classification,
					source.index,
					effectiveDestIndex,
				);
			} else {
				const currentDocs = documentsByAgendaItem[src.sectionId] ?? [];
				const currentCustoms = customTextsBySection?.[src.sectionId] ?? [];
				if (onMixedDndReorder && currentCustoms.length > 0) {
					onMixedDndReorder(
						src.sectionId,
						source.index,
						effectiveDestIndex,
						currentDocs,
						currentCustoms,
					);
				} else {
					onDndReorder?.(
						src.sectionId,
						src.sectionId,
						source.index,
						effectiveDestIndex,
					);
				}
			}
			return;
		}

		// Cross-section document transfer
		const destAllDocs = documentsByAgendaItem[dest.sectionId] ?? [];
		if (destAllDocs.some((doc) => doc.id === docId)) {
			const destItem = agendaItems.find((i) => i.id === dest.sectionId);
			showDndError(
				`This document already exists in "${destItem?.title ?? "that section"}" and cannot be added again.`,
			);
			return;
		}

		const allSrcDocs = [...(documentsByAgendaItem[src.sectionId] ?? [])].sort(
			(a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
		);
		// Always resolve via findIndex on the sorted array — source.index is the
		// unified DnD index (includes custom texts), but handleDndReorder/
		// handleCommitteeDocClassify sort by orderIndex before splicing.
		// Computing the index on a sorted copy keeps them consistent.
		const trueSourceIndex = allSrcDocs.findIndex((d) => d.id === docId);
		if (trueSourceIndex === -1) return;

		// Guard: prevent a document with an existing committee classification
		// from being placed into a different classification group.  This stops
		// the "drag out of committee → drag back into wrong group" flow.
		if (dest.classification) {
			const srcDoc = allSrcDocs[trueSourceIndex];
			const existingCls = srcDoc?.classification;
			if (
				existingCls &&
				existingCls !== "uncategorized" &&
				existingCls !== dest.classification
			) {
				showDndError(
					"This document belongs to a different committee and cannot be moved here.",
				);
				return;
			}
		}

		const trueDestIndex = dest.classification
			? (() => {
					const destGroupDocs = destAllDocs
						.filter(
							(d) =>
								(d.classification ?? "uncategorized") === dest.classification,
						)
						.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
					const anchor =
						destGroupDocs[destination.index - 1] ??
						destGroupDocs[destGroupDocs.length - 1];
					if (!anchor) return destAllDocs.length;
					return destAllDocs.findIndex((d) => d.id === anchor.id) + 1;
				})()
			: destination.index;

		if (dest.classification) {
			onCommitteeDocClassify?.(
				docId,
				src.sectionId,
				trueSourceIndex,
				dest.sectionId,
				trueDestIndex,
				dest.classification,
			);
		} else {
			// ── Mixed cross-section transfer ──────────────────────────────────
			// destination.index is a unified visual index (docs + custom texts
			// interleaved by orderIndex).  onDndReorder only reindexes docs, so
			// when the destination section contains custom texts the orderIndex
			// values would collide and items would render in the wrong order.
			// Fix: build unified lists, splice, reindex, and write both back.
			const destCustoms = customTextsBySection?.[dest.sectionId] ?? [];
			const srcCustoms = customTextsBySection?.[src.sectionId] ?? [];

			if (
				onWriteCommitteeState &&
				(destCustoms.length > 0 || srcCustoms.length > 0)
			) {
				const movedDoc = allSrcDocs[trueSourceIndex];
				if (!movedDoc) return;

				type Tagged =
					| { type: "doc"; item: AgendaDocument }
					| { type: "custom"; item: CustomTextItem };

				// ── Source: remove the doc and reindex ────────────────────────
				const newSrcDocs = allSrcDocs.filter((d) => d.id !== docId);
				const srcUnified: Tagged[] = [
					...newSrcDocs.map((d) => ({ type: "doc" as const, item: d })),
					...srcCustoms.map((c) => ({ type: "custom" as const, item: c })),
				].sort((a, b) => (a.item.orderIndex ?? 0) - (b.item.orderIndex ?? 0));

				const reindexedSrcDocs: AgendaDocument[] = [];
				const reindexedSrcCustoms: CustomTextItem[] = [];
				srcUnified.forEach((e, i) => {
					if (e.type === "doc")
						reindexedSrcDocs.push({
							...(e.item as AgendaDocument),
							orderIndex: i,
						});
					else
						reindexedSrcCustoms.push({
							...(e.item as CustomTextItem),
							orderIndex: i,
						});
				});

				// ── Destination: insert the doc and reindex ──────────────────
				const destUnified: Tagged[] = [
					...destAllDocs.map((d) => ({ type: "doc" as const, item: d })),
					...destCustoms.map((c) => ({ type: "custom" as const, item: c })),
				].sort((a, b) => (a.item.orderIndex ?? 0) - (b.item.orderIndex ?? 0));

				const clampedDest = Math.max(
					0,
					Math.min(trueDestIndex, destUnified.length),
				);
				destUnified.splice(clampedDest, 0, {
					type: "doc",
					item: movedDoc,
				});

				const reindexedDestDocs: AgendaDocument[] = [];
				const reindexedDestCustoms: CustomTextItem[] = [];
				destUnified.forEach((e, i) => {
					if (e.type === "doc")
						reindexedDestDocs.push({
							...(e.item as AgendaDocument),
							orderIndex: i,
						});
					else
						reindexedDestCustoms.push({
							...(e.item as CustomTextItem),
							orderIndex: i,
						});
				});

				onWriteCommitteeState(
					src.sectionId,
					reindexedSrcDocs,
					reindexedSrcCustoms,
				);
				onWriteCommitteeState(
					dest.sectionId,
					reindexedDestDocs,
					reindexedDestCustoms,
				);
			} else {
				onDndReorder?.(
					src.sectionId,
					dest.sectionId,
					trueSourceIndex,
					trueDestIndex,
				);
			}
		}
	};

	return {
		dndError,
		showDndError,
		dismissDndError,
		handleDragOver,
		handleDragLeave,
		handleDragEnd,
	};
}
