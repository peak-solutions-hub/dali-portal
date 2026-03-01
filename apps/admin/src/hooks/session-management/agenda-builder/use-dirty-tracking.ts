import { AgendaDocument, CustomTextItem } from "@repo/shared";
import { useCallback, useMemo, useRef, useState } from "react";

/**
 * Build a per-section fingerprint that jointly orders docs and custom texts,
 * normalizes orderIndex to sequential 0,1,2…, and filters empty custom texts.
 * Comparing fingerprints catches reorder changes (within and across item types)
 * while ignoring meaningless absolute orderIndex differences (e.g. after the
 * user reorders items and then reverts to the original order).
 *
 * Only meaningful editor-controlled fields are included in the fingerprint
 * (id, classification, summary for docs, content for customs).  Metadata that
 * never changes in the editor (agendaItemId, codeNumber, title) is excluded so
 * that a JSON roundtrip or server reload cannot cause false dirty detection.
 */
function buildSectionFingerprints(
	docs: Record<string, AgendaDocument[]>,
	customs: Record<string, CustomTextItem[]>,
): Record<string, string> {
	const allSections = new Set([...Object.keys(docs), ...Object.keys(customs)]);
	const result: Record<string, string> = {};
	for (const sectionId of allSections) {
		const sectionDocs = docs[sectionId] ?? [];
		const sectionCustoms = (customs[sectionId] ?? []).filter((item) => {
			const content = item.content;
			return (
				typeof content === "string" &&
				content.replace(/<[^>]*>/g, "").trim().length > 0
			);
		});
		if (sectionDocs.length === 0 && sectionCustoms.length === 0) continue;

		type Tagged =
			| { _t: "d"; item: AgendaDocument }
			| { _t: "c"; item: CustomTextItem };
		const combined: Tagged[] = [
			...sectionDocs.map((d) => ({ _t: "d" as const, item: d })),
			...sectionCustoms.map((c) => ({ _t: "c" as const, item: c })),
		];
		combined.sort(
			(a, b) =>
				(a.item.orderIndex ?? 0) - (b.item.orderIndex ?? 0) ||
				a.item.id.localeCompare(b.item.id),
		);

		// Only include fields the editor can change — id for identity,
		// classification for committee group, summary for doc edits,
		// content for custom text edits.
		// orderIndex is normalized to sequential position.
		result[sectionId] = JSON.stringify(
			combined.map((entry, idx) => {
				if (entry._t === "d") {
					const doc = entry.item as AgendaDocument;
					return {
						_t: "d",
						id: doc.id,
						orderIndex: idx,
						classification: doc.classification,
						summary: doc.summary ?? "",
					};
				}
				const ct = entry.item as CustomTextItem;
				return {
					_t: "c",
					id: ct.id,
					orderIndex: idx,
					content: ct.content,
					classification: ct.classification,
				};
			}),
		);
	}
	return result;
}

export function useDirtyTracking({
	contentTextMap,
	documentsByAgendaItem,
	customTextsBySection,
	agendaItemOrder,
	defaultOrder,
}: {
	contentTextMap: Record<string, string>;
	documentsByAgendaItem: Record<string, AgendaDocument[]>;
	customTextsBySection: Record<string, CustomTextItem[]>;
	agendaItemOrder: string[];
	defaultOrder: string[];
}) {
	const savedContentTextRef = useRef<string>("{}");
	const savedDocsByAgendaRef = useRef<string>("{}");
	const savedCustomTextsRef = useRef<string>("{}");
	const savedAgendaOrderRef = useRef<string>(JSON.stringify(defaultOrder));

	const [_saveTick, setSaveTick] = useState(0);

	const normalizeMap = useCallback((map: Record<string, unknown>) => {
		const cleaned: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(map)) {
			// Strip empty CustomTextItems from arrays before comparing —
			// an unsaved empty editor box should not count as a real change.
			const value = Array.isArray(v)
				? v.filter((item) => {
						if (
							item !== null &&
							typeof item === "object" &&
							"content" in item &&
							"orderIndex" in item
						) {
							const content = (item as { content: string }).content;
							return (
								typeof content === "string" &&
								content.replace(/<[^>]*>/g, "").trim().length > 0
							);
						}
						return true;
					})
				: v;

			if (
				value !== "" &&
				value !== undefined &&
				value !== null &&
				!(Array.isArray(value) && value.length === 0)
			) {
				cleaned[k] = value;
			}
		}
		return JSON.stringify(cleaned);
	}, []);

	const hasChanges = useMemo(() => {
		const currentContent = normalizeMap(contentTextMap);
		const currentOrder = JSON.stringify(agendaItemOrder);

		// Compare items via per-section combined fingerprints that jointly
		// order docs and custom texts, so both within-type and cross-type
		// reorders are detected while meaningless absolute orderIndex
		// differences (e.g. after reorder-back) are ignored.
		const currentFPs = buildSectionFingerprints(
			documentsByAgendaItem,
			customTextsBySection,
		);
		const savedFPs = buildSectionFingerprints(
			JSON.parse(savedDocsByAgendaRef.current || "{}"),
			JSON.parse(savedCustomTextsRef.current || "{}"),
		);
		const itemsChanged =
			JSON.stringify(currentFPs) !== JSON.stringify(savedFPs);

		return (
			currentContent !== savedContentTextRef.current ||
			itemsChanged ||
			currentOrder !== savedAgendaOrderRef.current
		);
	}, [
		contentTextMap,
		documentsByAgendaItem,
		customTextsBySection,
		agendaItemOrder,
		normalizeMap,
		_saveTick,
	]);

	const changedSections = useMemo<Set<string>>(() => {
		const changed = new Set<string>();

		// ── Content text comparison ──────────────────────────────────────
		const savedContent: Record<string, unknown> = JSON.parse(
			savedContentTextRef.current || "{}",
		);
		const allSectionIds = new Set([
			...Object.keys(contentTextMap),
			...Object.keys(savedContent),
		]);
		for (const sectionId of allSectionIds) {
			const currentVal = contentTextMap[sectionId] ?? "";
			const savedVal = (savedContent[sectionId] as string) ?? "";
			if (currentVal !== savedVal) changed.add(sectionId);
		}

		// ── Items comparison (docs + customs, combined per section) ─────
		// Uses the same joint fingerprint as hasChanges so both within-type
		// and cross-type reorders are detected at section granularity.
		const currentFPs = buildSectionFingerprints(
			documentsByAgendaItem,
			customTextsBySection,
		);
		const savedFPs = buildSectionFingerprints(
			JSON.parse(savedDocsByAgendaRef.current || "{}"),
			JSON.parse(savedCustomTextsRef.current || "{}"),
		);
		const allItemSections = new Set([
			...Object.keys(currentFPs),
			...Object.keys(savedFPs),
		]);
		for (const sectionId of allItemSections) {
			if ((currentFPs[sectionId] ?? "") !== (savedFPs[sectionId] ?? "")) {
				changed.add(sectionId);
			}
		}

		// ── Agenda order comparison ────────────────────────────────────
		const savedOrder = JSON.parse(savedAgendaOrderRef.current || "[]");
		if (JSON.stringify(agendaItemOrder) !== JSON.stringify(savedOrder)) {
			for (const id of agendaItemOrder) changed.add(id);
		}

		return changed;
	}, [
		contentTextMap,
		documentsByAgendaItem,
		customTextsBySection,
		agendaItemOrder,
		_saveTick,
	]);

	const snapshotSavedState = useCallback(() => {
		savedContentTextRef.current = normalizeMap(contentTextMap);
		savedDocsByAgendaRef.current = normalizeMap(documentsByAgendaItem);
		savedCustomTextsRef.current = normalizeMap(customTextsBySection);
		savedAgendaOrderRef.current = JSON.stringify(agendaItemOrder);
		setSaveTick((t) => t + 1);
	}, [
		normalizeMap,
		contentTextMap,
		documentsByAgendaItem,
		customTextsBySection,
		agendaItemOrder,
	]);

	const snapshotWithOverrides = useCallback(
		(overrides?: {
			docs?: Record<string, AgendaDocument[]>;
			customTexts?: Record<string, CustomTextItem[]>;
		}) => {
			savedContentTextRef.current = normalizeMap(contentTextMap);
			savedDocsByAgendaRef.current = normalizeMap(
				overrides?.docs ?? documentsByAgendaItem,
			);
			savedCustomTextsRef.current = normalizeMap(
				overrides?.customTexts ?? customTextsBySection,
			);
			savedAgendaOrderRef.current = JSON.stringify(agendaItemOrder);
			setSaveTick((t) => t + 1);
		},
		[
			normalizeMap,
			contentTextMap,
			documentsByAgendaItem,
			customTextsBySection,
			agendaItemOrder,
		],
	);

	return {
		hasChanges,
		changedSections,
		normalizeMap,
		snapshotSavedState,
		snapshotWithOverrides,
		savedContentTextRef,
		savedDocsByAgendaRef,
		savedCustomTextsRef,
		savedAgendaOrderRef,
		setSaveTick,
	};
}
