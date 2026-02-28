import type { DropResult } from "@hello-pangea/dnd";
import type {
	SessionManagementDocument as Document,
	SessionManagementAgendaItem,
} from "@repo/shared";
import { AgendaDocument, CustomTextItem } from "@repo/shared";
import { useState } from "react";

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
		sourceIndex: number,
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
	const [dndErrorTimer, setDndErrorTimer] = useState<ReturnType<
		typeof setTimeout
	> | null>(null);

	const showDndError = (message: string) => {
		if (dndErrorTimer) clearTimeout(dndErrorTimer);
		setDndError(message);
		const timer = setTimeout(() => setDndError(null), 4000);
		setDndErrorTimer(timer);
	};

	const handleDragOver = (e: React.DragEvent, _agendaItemId: string) => {
		e.preventDefault();
		e.currentTarget.classList.add("bg-blue-50", "border-blue-300");
	};
	const handleDragLeave = (e: React.DragEvent) => {
		e.currentTarget.classList.remove("bg-blue-50", "border-blue-300");
	};
	const handleDrop = (
		e: React.DragEvent,
		agendaItemId: string,
		onDropDocument: (agendaItemId: string, doc: Document) => void,
	) => {
		e.preventDefault();
		e.currentTarget.classList.remove("bg-blue-50", "border-blue-300");
		const documentData = e.dataTransfer.getData("application/json");
		if (documentData) onDropDocument(agendaItemId, JSON.parse(documentData));
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

		const groupDocs = flatDocs
			.filter((d) => (d.classification ?? "uncategorized") === classification)
			.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
		const groupCustoms = flatCustoms
			.filter((c) => (c.classification ?? "uncategorized") === classification)
			.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

		const unified: Array<
			| { type: "doc"; item: AgendaDocument }
			| { type: "custom"; item: CustomTextItem }
		> = [
			...groupDocs.map((d) => ({ type: "doc" as const, item: d })),
			...groupCustoms.map((c) => ({ type: "custom" as const, item: c })),
		].sort((a, b) => (a.item.orderIndex ?? 0) - (b.item.orderIndex ?? 0));

		const clamped = Math.max(0, Math.min(destIdx, unified.length - 1));
		const [moved] = unified.splice(sourceIdx, 1);
		if (!moved) return;
		unified.splice(clamped, 0, moved);

		const groupIds = new Set(unified.map((e) => e.item.id));
		const reorderedDocs: AgendaDocument[] = [];
		const reorderedCustoms: CustomTextItem[] = [];
		unified.forEach((e, i) => {
			if (e.type === "doc")
				reorderedDocs.push({ ...(e.item as AgendaDocument), orderIndex: i });
			else
				reorderedCustoms.push({
					...(e.item as CustomTextItem),
					orderIndex: i,
				});
		});

		const newDocs = [
			...flatDocs.filter((d) => !groupIds.has(d.id)),
			...reorderedDocs,
		];
		const newCustoms = [
			...flatCustoms.filter((c) => !groupIds.has(c.id)),
			...reorderedCustoms,
		];

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

			onMoveCustomText?.(
				src.sectionId,
				customSourceIndex,
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

		if (source.droppableId === destination.droppableId) {
			if (src.classification) {
				reorderCommitteeGroup(
					src.classification,
					source.index,
					destination.index,
				);
			} else {
				const currentDocs = documentsByAgendaItem[src.sectionId] ?? [];
				const currentCustoms = customTextsBySection?.[src.sectionId] ?? [];
				if (onMixedDndReorder && currentCustoms.length > 0) {
					onMixedDndReorder(
						src.sectionId,
						source.index,
						destination.index,
						currentDocs,
						currentCustoms,
					);
				} else {
					onDndReorder?.(
						src.sectionId,
						src.sectionId,
						source.index,
						destination.index,
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

		const allSrcDocs = documentsByAgendaItem[src.sectionId] ?? [];
		const trueSourceIndex = src.classification
			? allSrcDocs.findIndex((d) => d.id === docId)
			: source.index;
		if (trueSourceIndex === -1) return;

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
			onDndReorder?.(
				src.sectionId,
				dest.sectionId,
				trueSourceIndex,
				trueDestIndex,
			);
		}
	};

	return {
		dndError,
		setDndError,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleDragEnd,
	};
}
