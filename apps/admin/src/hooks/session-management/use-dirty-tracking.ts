import { useCallback, useMemo, useRef, useState } from "react";
import type {
	AttachedDocument,
	CustomTextItem,
} from "./use-agenda-builder.types";

export function useDirtyTracking({
	contentTextMap,
	documentsByAgendaItem,
	customTextsBySection,
	agendaItemOrder,
	defaultOrder,
}: {
	contentTextMap: Record<string, string>;
	documentsByAgendaItem: Record<string, AttachedDocument[]>;
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
		const currentDocs = normalizeMap(documentsByAgendaItem);
		const currentCustomTexts = normalizeMap(customTextsBySection);
		const currentOrder = JSON.stringify(agendaItemOrder);
		return (
			currentContent !== savedContentTextRef.current ||
			currentDocs !== savedDocsByAgendaRef.current ||
			currentCustomTexts !== savedCustomTextsRef.current ||
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

		const savedContent: Record<string, unknown> = JSON.parse(
			savedContentTextRef.current || "{}",
		);
		const savedDocs: Record<string, unknown> = JSON.parse(
			savedDocsByAgendaRef.current || "{}",
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

		const savedCustom: Record<string, unknown> = JSON.parse(
			savedCustomTextsRef.current || "{}",
		);
		const allCustomSectionIds = new Set([
			...Object.keys(customTextsBySection),
			...Object.keys(savedCustom),
		]);
		for (const sectionId of allCustomSectionIds) {
			const currentCustom = customTextsBySection[sectionId] ?? [];
			const savedCustomSection = savedCustom[sectionId];
			if (
				JSON.stringify(currentCustom) !==
				JSON.stringify(savedCustomSection ?? [])
			) {
				changed.add(sectionId);
			}
		}

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
			docs?: Record<string, AttachedDocument[]>;
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
