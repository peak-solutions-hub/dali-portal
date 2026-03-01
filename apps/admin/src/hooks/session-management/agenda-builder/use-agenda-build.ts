import type {
	AgendaDocument,
	BuildAgendaItem,
	CustomTextItem,
} from "@repo/shared";
import { SessionSection } from "@repo/shared";
import { DEFAULT_AGENDA_ITEMS } from "@repo/ui/lib/session-ui";
import { useCallback, useMemo } from "react";

export function useAgendaBuild({
	contentTextMap,
	documentsByAgendaItem,
	customTextsBySection,
	agendaItemOrder,
	orderedSections,
}: {
	contentTextMap: Record<string, string>;
	documentsByAgendaItem: Record<string, AgendaDocument[]>;
	customTextsBySection: Record<string, CustomTextItem[]>;
	agendaItemOrder: string[];
	orderedSections: typeof DEFAULT_AGENDA_ITEMS;
}) {
	const isSessionEmpty = useMemo(() => {
		const hasAnyContent = Object.values(contentTextMap).some(
			(v) => typeof v === "string" && v.trim().length > 0,
		);
		const hasAnyDocs = Object.values(documentsByAgendaItem).some(
			(docs) => Array.isArray(docs) && docs.length > 0,
		);
		const hasAnyCustomTexts = Object.values(customTextsBySection).some(
			(texts) =>
				Array.isArray(texts) &&
				texts.some(
					(t) =>
						typeof t.content === "string" &&
						t.content.replace(/<[^>]*>/g, "").trim().length > 0,
				),
		);
		return !hasAnyContent && !hasAnyDocs && !hasAnyCustomTexts;
	}, [contentTextMap, documentsByAgendaItem, customTextsBySection]);

	const buildAgendaItems = useCallback(
		(overrides?: {
			docs?: Record<string, AgendaDocument[]>;
			customTexts?: Record<string, CustomTextItem[]>;
		}): BuildAgendaItem[] => {
			const docsMap = overrides?.docs ?? documentsByAgendaItem;
			const customMap = overrides?.customTexts ?? customTextsBySection;
			const agendaItems: BuildAgendaItem[] = [];
			let orderIdx = 0;

			for (const item of orderedSections) {
				const sectionDocs = docsMap[item.id] || [];
				const sectionContentText = contentTextMap[item.id] || null;
				const sectionCustomTexts = customMap[item.id] || [];

				if (item.section === SessionSection.COMMITTEE_REPORTS) {
					const docGroups: Record<string, typeof sectionDocs> = {};
					for (const doc of sectionDocs) {
						const key = doc.classification || "uncategorized";
						if (!docGroups[key]) docGroups[key] = [];
						docGroups[key]!.push(doc);
					}
					const customGroups: Record<string, CustomTextItem[]> = {};
					for (const ct of sectionCustomTexts) {
						const key = ct.classification || "uncategorized";
						if (!customGroups[key]) customGroups[key] = [];
						customGroups[key]!.push(ct);
					}
					const allClassifications = Array.from(
						new Set([...Object.keys(docGroups), ...Object.keys(customGroups)]),
					);
					for (const classification of allClassifications) {
						// Sort each group by orderIndex so the saved drag order is preserved
						// when the items are emitted to the backend.
						type MixedCommitteeEntry =
							| { type: "doc"; item: (typeof sectionDocs)[number] }
							| { type: "custom"; item: CustomTextItem };
						const groupItems: MixedCommitteeEntry[] = [
							...(docGroups[classification] ?? []).map((d) => ({
								type: "doc" as const,
								item: d,
							})),
							...(customGroups[classification] ?? []).map((c) => ({
								type: "custom" as const,
								item: c,
							})),
						].sort(
							(a, b) => (a.item.orderIndex ?? 0) - (b.item.orderIndex ?? 0),
						);

						for (const entry of groupItems) {
							if (entry.type === "doc") {
								const doc = entry.item;
								agendaItems.push({
									section: item.section,
									orderIndex: orderIdx++,
									contentText: doc.summary || null,
									linkedDocument: doc.id,
									classification,
								});
							} else {
								const ct = entry.item;
								// Skip empty custom-text items — they are transient editor placeholders
								// and should never be persisted to the server.
								const hasContent =
									typeof ct.content === "string" &&
									ct.content.replace(/<[^>]*>/g, "").trim().length > 0;
								if (!hasContent) continue;
								// Encode the classification as a hidden HTML comment prepended to contentText.
								// The backend has no classification column for custom-text agenda items, so
								// this marker survives the round-trip. The portal page parses & strips it for
								// grouping; use-session-actions strips it when loading back into the editor.
								const classificationMarker = `<!--classification:${classification}-->`;
								const encodedContent = `${classificationMarker}${ct.content}`;
								agendaItems.push({
									section: item.section,
									orderIndex: orderIdx++,
									contentText: encodedContent,
									linkedDocument: null,
									classification,
									isCustomText: true,
								});
							}
						}
					}
					if (sectionContentText) {
						agendaItems.push({
							section: item.section,
							orderIndex: orderIdx++,
							contentText: sectionContentText,
							linkedDocument: null,
						});
					}
				} else {
					if (sectionDocs.length === 0 && sectionCustomTexts.length === 0) {
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
						type MixedItem =
							| { type: "doc"; doc: AgendaDocument; sortKey: number }
							| { type: "custom"; ct: CustomTextItem; sortKey: number };

						const mixed: MixedItem[] = [
							...sectionDocs.map((doc, idx) => ({
								type: "doc" as const,
								doc,
								sortKey: doc.orderIndex ?? idx * 1000,
							})),
							...sectionCustomTexts.map((ct) => ({
								type: "custom" as const,
								ct,
								sortKey: ct.orderIndex,
							})),
						];
						mixed.sort((a, b) => a.sortKey - b.sortKey);

						for (const entry of mixed) {
							if (entry.type === "doc") {
								agendaItems.push({
									section: item.section,
									orderIndex: orderIdx++,
									contentText: entry.doc.summary || null,
									linkedDocument: entry.doc.id,
								});
							} else {
								// Skip empty custom-text items — transient editor placeholders.
								const ctContent = entry.ct.content;
								const hasContent =
									typeof ctContent === "string" &&
									ctContent.replace(/<[^>]*>/g, "").trim().length > 0;
								if (!hasContent) continue;
								agendaItems.push({
									section: item.section,
									orderIndex: orderIdx++,
									contentText: ctContent,
									linkedDocument: null,
									isCustomText: true,
								});
							}
						}
					}
				}
			}
			return agendaItems;
		},
		[
			documentsByAgendaItem,
			contentTextMap,
			customTextsBySection,
			orderedSections,
		],
	);

	return { isSessionEmpty, buildAgendaItems };
}
