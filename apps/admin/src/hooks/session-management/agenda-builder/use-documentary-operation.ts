import { AgendaDocument, CustomTextItem } from "@repo/shared";
import { useCallback } from "react";

export function useDocumentOperations({
	agendaItemOrder,
	documentsByAgendaItem,
	setDocumentsByAgendaItem,
	setCustomTextsBySection,
}: {
	agendaItemOrder: string[];
	documentsByAgendaItem: Record<string, AgendaDocument[]>;
	setDocumentsByAgendaItem: React.Dispatch<
		React.SetStateAction<Record<string, AgendaDocument[]>>
	>;
	setCustomTextsBySection: React.Dispatch<
		React.SetStateAction<Record<string, CustomTextItem[]>>
	>;
}) {
	const handleMoveDocument = useCallback(
		(documentId: string, direction: "up" | "down") => {
			setDocumentsByAgendaItem((prev) => {
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

				if (direction === "up" && sourceIndex > 0) {
					const temp = sourceDocs[sourceIndex]!;
					sourceDocs[sourceIndex] = sourceDocs[sourceIndex - 1]!;
					sourceDocs[sourceIndex - 1] = temp;
					return { ...prev, [sourceSectionId]: sourceDocs };
				}
				if (direction === "down" && sourceIndex < sourceDocs.length - 1) {
					const temp = sourceDocs[sourceIndex]!;
					sourceDocs[sourceIndex] = sourceDocs[sourceIndex + 1]!;
					sourceDocs[sourceIndex + 1] = temp;
					return { ...prev, [sourceSectionId]: sourceDocs };
				}

				const step = direction === "up" ? -1 : 1;
				let targetSectionId: string | null = null;
				for (
					let i = sectionIdx + step;
					i >= 0 && i < agendaItemOrder.length;
					i += step
				) {
					const candidateId = agendaItemOrder[i]!;
					const candidateDocs = prev[candidateId] ?? [];
					if (candidateDocs.some((d) => d.id === documentId)) continue;
					targetSectionId = candidateId;
					break;
				}
				if (!targetSectionId) return prev;

				const movedDoc = sourceDocs[sourceIndex]!;
				const newSourceDocs = sourceDocs.filter((_, i) => i !== sourceIndex);
				const targetDocs = [...(prev[targetSectionId] ?? [])];
				if (direction === "up") targetDocs.push(movedDoc);
				else targetDocs.unshift(movedDoc);

				return {
					...prev,
					[sourceSectionId]: newSourceDocs,
					[targetSectionId]: targetDocs,
				};
			});
		},
		[agendaItemOrder, setDocumentsByAgendaItem],
	);

	const moveDocumentToSection = useCallback(
		(
			documentId: string,
			targetSectionId: string,
			insertBeforeDocId?: string,
		) => {
			setDocumentsByAgendaItem((prev) => {
				let movedDoc: AgendaDocument | null = null;
				for (const sectionId of agendaItemOrder) {
					const doc = (prev[sectionId] ?? []).find((d) => d.id === documentId);
					if (doc) {
						movedDoc = doc;
						break;
					}
				}
				if (!movedDoc) return prev;

				const next: Record<string, AgendaDocument[]> = {};
				for (const sectionId of agendaItemOrder) {
					next[sectionId] = (prev[sectionId] ?? []).filter(
						(d) => d.id !== documentId,
					);
				}

				const targetDocs = [...(next[targetSectionId] ?? [])];
				if (insertBeforeDocId) {
					const insertIdx = targetDocs.findIndex(
						(d) => d.id === insertBeforeDocId,
					);
					if (insertIdx !== -1) targetDocs.splice(insertIdx, 0, movedDoc);
					else targetDocs.push(movedDoc);
				} else {
					targetDocs.push(movedDoc);
				}
				next[targetSectionId] = targetDocs;
				return next;
			});
		},
		[agendaItemOrder, setDocumentsByAgendaItem],
	);

	const handleDndReorder = useCallback(
		(
			sourceSectionId: string,
			destSectionId: string,
			sourceIndex: number,
			destIndex: number,
		) => {
			setDocumentsByAgendaItem((prev) => {
				if (sourceSectionId === destSectionId) {
					const docs = [...(prev[sourceSectionId] ?? [])].sort(
						(a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
					);
					const [moved] = docs.splice(sourceIndex, 1);
					if (!moved) return prev;
					docs.splice(destIndex, 0, moved);
					return {
						...prev,
						[sourceSectionId]: docs.map((d, i) => ({ ...d, orderIndex: i })),
					};
				}

				const sourceDocs = [...(prev[sourceSectionId] ?? [])].sort(
					(a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
				);
				const destDocs = [...(prev[destSectionId] ?? [])].sort(
					(a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
				);
				const [moved] = sourceDocs.splice(sourceIndex, 1);
				if (!moved) return prev;
				if (destDocs.some((d) => d.id === moved.id)) return prev;
				destDocs.splice(destIndex, 0, moved);
				return {
					...prev,
					[sourceSectionId]: sourceDocs.map((d, i) => ({
						...d,
						orderIndex: i,
					})),
					[destSectionId]: destDocs.map((d, i) => ({ ...d, orderIndex: i })),
				};
			});
		},
		[setDocumentsByAgendaItem],
	);

	/**
	 * Write pre-computed docs+customs directly into state for a section.
	 * Used by reorderCommitteeGroup in agenda-panel after it has already
	 * spliced and re-indexed the flat arrays — no further sort/splice here.
	 */
	const writeCommitteeState = useCallback(
		(
			sectionId: string,
			newDocs: AgendaDocument[],
			newCustoms: CustomTextItem[],
		) => {
			setDocumentsByAgendaItem((prev) => ({ ...prev, [sectionId]: newDocs }));
			setCustomTextsBySection((prev) => ({ ...prev, [sectionId]: newCustoms }));
		},
		[setDocumentsByAgendaItem, setCustomTextsBySection],
	);

	const handleMixedDndReorder = useCallback(
		(
			sectionId: string,
			sourceIndex: number,
			destIndex: number,
			currentDocs: AgendaDocument[],
			currentCustoms: CustomTextItem[],
		) => {
			type MixedEntry =
				| { type: "doc"; item: AgendaDocument }
				| { type: "custom"; item: CustomTextItem };

			const unified: MixedEntry[] = [
				...currentDocs.map((d) => ({ type: "doc" as const, item: d })),
				...currentCustoms.map((c) => ({ type: "custom" as const, item: c })),
			].sort((a, b) => (a.item.orderIndex ?? 0) - (b.item.orderIndex ?? 0));

			const clamped = Math.max(0, Math.min(destIndex, unified.length - 1));
			const [moved] = unified.splice(sourceIndex, 1);
			if (!moved) return;
			unified.splice(clamped, 0, moved);

			let idx = 0;
			const orderedDocs: AgendaDocument[] = [];
			const orderedCustoms: CustomTextItem[] = [];
			for (const e of unified) {
				if (e.type === "doc")
					orderedDocs.push({
						...(e.item as AgendaDocument),
						orderIndex: idx++,
					});
				else
					orderedCustoms.push({
						...(e.item as CustomTextItem),
						orderIndex: idx++,
					});
			}

			setDocumentsByAgendaItem((prev) => ({
				...prev,
				[sectionId]: orderedDocs,
			}));
			setCustomTextsBySection((prev) => ({
				...prev,
				[sectionId]: orderedCustoms,
			}));
		},
		[setDocumentsByAgendaItem, setCustomTextsBySection],
	);

	const isDocumentFirstGlobal = useCallback(
		(documentId: string): boolean => {
			let sourceSectionIdx = -1;
			let sourceDocIdx = -1;
			for (let i = 0; i < agendaItemOrder.length; i++) {
				const docs = documentsByAgendaItem[agendaItemOrder[i]!] ?? [];
				const idx = docs.findIndex((d) => d.id === documentId);
				if (idx !== -1) {
					sourceSectionIdx = i;
					sourceDocIdx = idx;
					break;
				}
			}
			if (sourceSectionIdx === -1) return true;
			if (sourceDocIdx > 0) return false;
			for (let i = sourceSectionIdx - 1; i >= 0; i--) {
				const docs = documentsByAgendaItem[agendaItemOrder[i]!] ?? [];
				if (docs.some((d) => d.id === documentId)) continue;
				return false;
			}
			return true;
		},
		[agendaItemOrder, documentsByAgendaItem],
	);

	const isDocumentLastGlobal = useCallback(
		(documentId: string): boolean => {
			let sourceSectionIdx = -1;
			let sourceDocIdx = -1;
			let sourceSectionLength = 0;
			for (let i = 0; i < agendaItemOrder.length; i++) {
				const docs = documentsByAgendaItem[agendaItemOrder[i]!] ?? [];
				const idx = docs.findIndex((d) => d.id === documentId);
				if (idx !== -1) {
					sourceSectionIdx = i;
					sourceDocIdx = idx;
					sourceSectionLength = docs.length;
					break;
				}
			}
			if (sourceSectionIdx === -1) return true;
			if (sourceDocIdx < sourceSectionLength - 1) return false;
			for (let i = sourceSectionIdx + 1; i < agendaItemOrder.length; i++) {
				const docs = documentsByAgendaItem[agendaItemOrder[i]!] ?? [];
				if (docs.some((d) => d.id === documentId)) continue;
				return false;
			}
			return true;
		},
		[agendaItemOrder, documentsByAgendaItem],
	);

	return {
		handleMoveDocument,
		moveDocumentToSection,
		handleDndReorder,
		handleMixedDndReorder,
		writeCommitteeState,
		isDocumentFirstGlobal,
		isDocumentLastGlobal,
	};
}
