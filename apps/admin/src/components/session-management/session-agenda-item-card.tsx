import { Droppable } from "@hello-pangea/dnd";
import type {
	SessionManagementAgendaItem,
	SessionManagementSession,
} from "@repo/shared";
import { AgendaDocument, CustomTextItem } from "@repo/shared";
import { GripVertical, Plus } from "@repo/ui/lib/lucide-react";
import {
	formatAgendaItemNumber,
	getClassificationLabel,
	getSessionTypeLabel,
} from "@repo/ui/lib/session-ui";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatMinutesDate } from "@/utils/session-helpers";
import {
	SessionAddTextButton,
	SessionClassificationPicker,
	SessionCustomTextRow,
	SessionDocumentRow,
	SessionMinutesPicker,
	SessionMinutesReadOnly,
} from "./agenda-item-card";

const MINUTES_SECTION = "reading_and_or_approval_of_the_minutes";

type UnifiedEntry =
	| { type: "doc"; item: AgendaDocument; originalIndex: number }
	| { type: "custom"; item: CustomTextItem; originalIndex: number };

interface AgendaItemCardProps {
	item: SessionManagementAgendaItem;
	documents?: AgendaDocument[];
	sessions?: SessionManagementSession[];
	selectedSessionId?: string;
	contentText?: string;
	onContentTextChange?: (itemId: string, text: string) => void;
	onAddDocument?: (itemId: string) => void;
	onRemoveDocument?: (agendaItemId: string, documentId: string) => void;
	onUpdateDocumentSummary?: (
		agendaItemId: string,
		documentId: string,
		summary: string,
	) => void;
	onViewDocument?: (documentId: string) => void;
	isDndEnabled?: boolean;
	isModified?: boolean;
	customTexts?: CustomTextItem[];
	onAddCustomText?: (sectionId: string, classification?: string) => void;
	onUpdateCustomText?: (
		sectionId: string,
		itemId: string,
		content: string,
	) => void;
	onRemoveCustomText?: (sectionId: string, itemId: string) => void;
	onReorderCustomTexts?: (
		sectionId: string,
		sourceIndex: number,
		destIndex: number,
		classification?: string,
	) => void;
	isCustomTextReadOnly?: boolean;
	removingItemIds?: Set<string>;
	/** When true, all open editors close immediately (e.g. action in flight). */
	closeEditors?: boolean;
	/** Assign a flush fn here — calling it auto-saves any open editor before save/publish. */
	flushRef?: React.MutableRefObject<(() => void) | null>;
	/** Called when any editor inside this card opens — lets the panel flush other cards. */
	onEditorOpen?: () => void;
	isRemovingAny?: boolean;
}

export function AgendaItemCard({
	item,
	documents = [],
	sessions = [],
	selectedSessionId,
	contentText,
	onContentTextChange,
	onAddDocument,
	onRemoveDocument,
	onUpdateDocumentSummary,
	onViewDocument,
	isDndEnabled,
	isModified,
	customTexts = [],
	onAddCustomText,
	onUpdateCustomText,
	onRemoveCustomText,
	onReorderCustomTexts,
	isCustomTextReadOnly = false,
	removingItemIds,
	isRemovingAny,
	closeEditors,
	flushRef,
	onEditorOpen,
}: AgendaItemCardProps) {
	const [activeEditorId, setActiveEditorId] = useState<string | null>(null);
	const [showClassificationPicker, setShowClassificationPicker] =
		useState(false);

	// Per-custom-text flush refs keyed by item id
	const customFlushRefs = useRef<
		Map<string, React.MutableRefObject<(() => void) | null>>
	>(new Map());
	const getOrCreateFlushRef = useCallback((id: string) => {
		if (!customFlushRefs.current.has(id)) {
			customFlushRefs.current.set(id, { current: null });
		}
		return customFlushRefs.current.get(id)!;
	}, []);

	// Per-document-row flush refs keyed by doc id
	const docFlushRefs = useRef<
		Map<string, React.MutableRefObject<(() => void) | null>>
	>(new Map());
	const getOrCreateDocFlushRef = useCallback((docId: string) => {
		if (!docFlushRefs.current.has(docId)) {
			docFlushRefs.current.set(docId, { current: null });
		}
		return docFlushRefs.current.get(docId)!;
	}, []);

	// Register card-level flush fn — agenda-panel calls this before save/publish.
	// Each document row and custom text row owns its own editor state and flush fn;
	// we just fan out to all of them here.
	useEffect(() => {
		if (!flushRef) return;
		flushRef.current = () => {
			let hadContent = false;
			for (const ref of docFlushRefs.current.values()) {
				if (ref.current?.()) hadContent = true;
			}
			for (const ref of customFlushRefs.current.values()) {
				if (ref.current?.()) hadContent = true;
			}
			setActiveEditorId(null);
			return hadContent;
		};
	});

	// Close all editors when an action is in flight (publish/save confirms).
	// Document rows handle their own closeEditor signal via the closeEditor prop.
	useEffect(() => {
		if (closeEditors) {
			setActiveEditorId(null);
		}
	}, [closeEditors]);

	const [isCustomMinutes, setIsCustomMinutes] = useState(false);
	const [customDate, setCustomDate] = useState<Date | undefined>(() => {
		if (!contentText) return undefined;
		const match = contentText.match(
			/of (\w+ \d{2}, \d{4}) (Regular Session|Special Session)/,
		);
		if (!match) return undefined;
		const parsed = new Date(match[1]!);
		return Number.isNaN(parsed.getTime()) ? undefined : parsed;
	});
	const [customSessionType, setCustomSessionType] = useState<string>(() => {
		if (!contentText) return "";
		const match = contentText.match(/(Regular Session|Special Session)$/);
		return match ? match[1]! : "";
	});

	const isMinutesSection = item.section === MINUTES_SECTION;
	const isCommitteeReports = item.section === "committee_reports";

	const minutesSessions = sessions.filter(
		(s) => s.id !== selectedSessionId && s.status === "completed",
	);

	const contentMatchesKnownSession =
		!!contentText &&
		minutesSessions.some((s) => {
			const dateFormatted = formatMinutesDate(s.date);
			const typeLabel = getSessionTypeLabel(s.type);
			return (
				contentText.includes(dateFormatted) && contentText.includes(typeLabel)
			);
		});

	const isCustomMinutesResolved =
		isCustomMinutes || (!!contentText && !contentMatchesKnownSession);

	const derivedMinutesSessionId = (() => {
		if (!isMinutesSection) return "__none__";
		if (isCustomMinutesResolved) return "__custom__";
		if (!contentText) return "__none__";
		const matched = minutesSessions.find((s) => {
			const dateFormatted = formatMinutesDate(s.date);
			const typeLabel = getSessionTypeLabel(s.type);
			return (
				contentText.includes(dateFormatted) && contentText.includes(typeLabel)
			);
		});
		return matched?.id ?? "__none__";
	})();

	const handleMinutesSessionSelect = (sessionId: string) => {
		if (sessionId === "__none__") {
			setIsCustomMinutes(false);
			setCustomDate(undefined);
			setCustomSessionType("");
			onContentTextChange?.(item.id, "");
			return;
		}
		if (sessionId === "__custom__") {
			setIsCustomMinutes(true);
			return;
		}
		setIsCustomMinutes(false);
		setCustomDate(undefined);
		setCustomSessionType("");
		const session = sessions.find((s) => s.id === sessionId);
		if (!session) return;
		const text = `Reading and/or approval of the Minutes of ${formatMinutesDate(session.date)} ${getSessionTypeLabel(session.type)}`;
		onContentTextChange?.(item.id, text);
	};

	const handleCustomMinutesChange = (date: Date | undefined, type: string) => {
		const text = `Reading and/or approval of the Minutes of ${date ? format(date, "MMMM dd, yyyy") : "[date]"} ${type || "[session type]"}`;
		onContentTextChange?.(item.id, text);
	};

	/** Called by a doc row when its editor opens — flushes other open editors */
	const handleDocEditorOpen = (doc: AgendaDocument) => {
		onEditorOpen?.(); // let panel flush other cards
		// Flush every other doc row editor and all custom text editors
		for (const [id, ref] of docFlushRefs.current.entries()) {
			if (id !== doc.id) ref.current?.();
		}
		for (const ref of customFlushRefs.current.values()) {
			ref.current?.();
		}
		setActiveEditorId(`summary::${doc.id}`);
	};

	const handleCustomEditorFocus = (id: string) => {
		if (!id) {
			setActiveEditorId(null);
		} else {
			onEditorOpen?.(); // let panel flush other cards
			// Flush any open doc summary editors
			for (const ref of docFlushRefs.current.values()) {
				ref.current?.();
			}
			// Flush any other open custom text editor within this card
			for (const [ctId, ref] of customFlushRefs.current.entries()) {
				if (ctId !== id) ref.current?.();
			}
			setActiveEditorId(`custom::${id}`);
		}
	};

	/** Flush any open editor in this card, then delegate to onAddCustomText */
	const handleAddCustomText = (sectionId: string, classification?: string) => {
		// Flush all open doc summary and custom text editors before opening a new one
		for (const ref of docFlushRefs.current.values()) {
			ref.current?.();
		}
		for (const ref of customFlushRefs.current.values()) {
			ref.current?.();
		}
		setActiveEditorId(null);
		onAddCustomText?.(sectionId, classification);
	};

	const committeeGroups = useMemo(() => {
		if (!isCommitteeReports) return null;
		const groups = new Map<
			string,
			{ docs: AgendaDocument[]; texts: CustomTextItem[] }
		>();
		for (const doc of documents) {
			const key = doc.classification || "uncategorized";
			if (!groups.has(key)) groups.set(key, { docs: [], texts: [] });
			groups.get(key)!.docs.push(doc);
		}
		for (const ct of customTexts) {
			const key = ct.classification || "uncategorized";
			if (!groups.has(key)) groups.set(key, { docs: [], texts: [] });
			groups.get(key)!.texts.push(ct);
		}
		// Sort groups by the minimum orderIndex of their items so that
		// reordering within a group never changes the group display order.
		const sorted = new Map(
			[...groups.entries()].sort((a, b) => {
				const minA = Math.min(
					...a[1].docs.map((d) => d.orderIndex ?? Infinity),
					...a[1].texts.map((t) => t.orderIndex ?? Infinity),
				);
				const minB = Math.min(
					...b[1].docs.map((d) => d.orderIndex ?? Infinity),
					...b[1].texts.map((t) => t.orderIndex ?? Infinity),
				);
				return minA - minB;
			}),
		);
		return sorted;
	}, [isCommitteeReports, documents, customTexts]);

	const usedClassifications = committeeGroups
		? Array.from(committeeGroups.keys())
		: [];

	// Shared props for DocumentRow to avoid repetition
	const docRowSharedProps = {
		sectionId: item.id,
		isDndEnabled,
		removingItemIds,
		isRemovingAny,
		onViewDocument,
		onUpdateDocumentSummary,
		onRemoveDocument,
		onEditorOpen: handleDocEditorOpen,
		closeEditor: closeEditors,
	};

	// Shared props for CustomTextRow to avoid repetition
	const customTextSharedProps = {
		sectionId: item.id,
		onUpdate: onUpdateCustomText ?? (() => undefined),
		onRemove: onRemoveCustomText ?? (() => undefined),
		isDndEnabled: isDndEnabled && !!onReorderCustomTexts,
		isReadOnly: isCustomTextReadOnly,
		isRemovingAny,
		onEditorFocus: handleCustomEditorFocus,
	};

	const resolveCustomTextActiveEditorId = (ctId: string) =>
		activeEditorId === `custom::${ctId}`
			? ctId
			: activeEditorId === null
				? undefined
				: "";

	const dragDropZone = (droppableId: string) => (
		<Droppable droppableId={droppableId}>
			{(provided, snapshot) => (
				<div
					ref={provided.innerRef}
					{...provided.droppableProps}
					className={`flex h-9 w-full items-center justify-center gap-2 rounded-md border border-dashed px-3 py-1 text-sm transition-colors ${
						snapshot.isDraggingOver
							? "border-blue-400 bg-blue-50 text-blue-500"
							: "border-gray-300 bg-[#f3f3f5] text-gray-400"
					}`}
				>
					{!snapshot.isDraggingOver && (
						<>
							<GripVertical className="h-3.5 w-3.5" />
							<span>Drag a document here</span>
						</>
					)}
					{provided.placeholder}
				</div>
			)}
		</Droppable>
	);

	return (
		<div
			className={`flex flex-col gap-3 rounded-lg border p-4 bg-white transition-all duration-300 ${
				isModified
					? "border-l-amber-400 border-l-[3px] border-gray-200"
					: "border-gray-200"
			}`}
		>
			{/* Section header */}
			<div className="flex items-center gap-2">
				<h4 className="text-base font-medium text-gray-900 leading-6">
					{item.title}
				</h4>
				{isModified && (
					<span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-400/30">
						Unsaved
					</span>
				)}
			</div>

			{/* Minutes picker (editable) */}
			{isMinutesSection && onContentTextChange && (
				<SessionMinutesPicker
					sessions={sessions}
					selectedSessionId={selectedSessionId}
					contentText={contentText}
					isCustomMinutesResolved={isCustomMinutesResolved}
					customDate={customDate}
					setCustomDate={setCustomDate}
					customSessionType={customSessionType}
					setCustomSessionType={setCustomSessionType}
					derivedMinutesSessionId={derivedMinutesSessionId}
					onMinutesSessionSelect={handleMinutesSessionSelect}
					onCustomMinutesChange={handleCustomMinutesChange}
				/>
			)}

			{/* Minutes read-only display */}
			{isMinutesSection && !onContentTextChange && contentText && (
				<SessionMinutesReadOnly contentText={contentText} />
			)}

			{/* Committee Reports: grouped by classification, each group is its own droppable */}
			{isCommitteeReports && committeeGroups && (
				<div className="flex flex-col gap-4">
					{Array.from(committeeGroups.entries()).map(
						([classification, { docs, texts }], groupIndex) => {
							const groupDroppableId = `committee-group::${classification}`;
							// Unified list sorted by orderIndex so drag indices match visual order
							type MixedEntry =
								| { type: "doc"; item: AgendaDocument }
								| { type: "custom"; item: CustomTextItem };
							const unified: MixedEntry[] = [
								...docs.map((d) => ({ type: "doc" as const, item: d })),
								...texts.map((c) => ({ type: "custom" as const, item: c })),
							].sort((a, b) => {
								const diff =
									(a.item.orderIndex ?? 0) - (b.item.orderIndex ?? 0);
								if (diff !== 0) return diff;
								// Stable tiebreak: docs before custom texts on equal orderIndex
								if (a.type === "doc" && b.type !== "doc") return -1;
								if (a.type !== "doc" && b.type === "doc") return 1;
								return 0;
							});

							return (
								<div key={classification} className="flex flex-col gap-2">
									<h5 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
										{groupIndex + 1}. COMMITTEE ON{" "}
										{getClassificationLabel(classification).toUpperCase()}
									</h5>
									<Droppable
										droppableId={groupDroppableId}
										isDropDisabled={!isDndEnabled}
									>
										{(provided, snapshot) => (
											<div
												ref={provided.innerRef}
												{...provided.droppableProps}
												className={`flex flex-col gap-2 ml-4 min-h-2 rounded transition-colors ${
													snapshot.isDraggingOver
														? "bg-blue-50/50 ring-1 ring-blue-200 ring-inset"
														: ""
												}`}
											>
												{unified.map((entry, unifiedIdx) => {
													const label = `${String.fromCharCode(97 + unifiedIdx)}.`;
													if (entry.type === "doc") {
														return (
															<SessionDocumentRow
																key={entry.item.id}
																doc={entry.item}
																draggableIndex={unifiedIdx}
																numberLabel={label}
																{...docRowSharedProps}
																flushRef={getOrCreateDocFlushRef(entry.item.id)}
															/>
														);
													}
													const ct = entry.item as CustomTextItem;
													return (
														<SessionCustomTextRow
															key={ct.id}
															item={ct}
															numberLabel={label}
															draggableIndex={unifiedIdx}
															customIndex={texts.indexOf(ct)}
															docCountInDroppable={docs.length}
															isRemoving={removingItemIds?.has(ct.id)}
															activeEditorId={resolveCustomTextActiveEditorId(
																ct.id,
															)}
															flushRef={getOrCreateFlushRef(ct.id)}
															{...customTextSharedProps}
														/>
													);
												})}
												{provided.placeholder}
												{onAddCustomText && (
													<SessionAddTextButton
														onClick={() =>
															handleAddCustomText(item.id, classification)
														}
													/>
												)}
											</div>
										)}
									</Droppable>
								</div>
							);
						},
					)}

					{onAddDocument &&
						isDndEnabled &&
						dragDropZone(`committee-drop::${item.id}`)}

					{onAddCustomText && (
						<div className="relative">
							{showClassificationPicker ? (
								<SessionClassificationPicker
									excludeKeys={usedClassifications}
									onSelect={(key) => {
										handleAddCustomText(item.id, key);
										setShowClassificationPicker(false);
									}}
									onClose={() => setShowClassificationPicker(false)}
								/>
							) : (
								<button
									type="button"
									onClick={() => setShowClassificationPicker(true)}
									className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-gray-100 px-3 py-1 text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer"
								>
									<Plus className="h-3.5 w-3.5" />
									<span>Add Committee</span>
								</button>
							)}
						</div>
					)}
				</div>
			)}

			{/* Regular sections: unified doc + custom text droppable */}
			{!isCommitteeReports && (
				<>
					{(() => {
						const unified: UnifiedEntry[] = [
							...documents.map((doc, idx) => ({
								type: "doc" as const,
								item: doc,
								originalIndex: idx,
							})),
							...customTexts.map((ct, idx) => ({
								type: "custom" as const,
								item: ct,
								originalIndex: idx,
							})),
						];
						unified.sort((a, b) => {
							const keyA =
								a.type === "doc"
									? (a.item.orderIndex ?? a.originalIndex * 1000)
									: (a.item as CustomTextItem).orderIndex;
							const keyB =
								b.type === "doc"
									? (b.item.orderIndex ?? b.originalIndex * 1000)
									: (b.item as CustomTextItem).orderIndex;
							return keyA - keyB;
						});

						if (unified.length === 0) return null;

						return (
							<Droppable droppableId={item.id} isDropDisabled={!isDndEnabled}>
								{(provided, snapshot) => (
									<div
										ref={provided.innerRef}
										{...provided.droppableProps}
										className={`flex flex-col gap-2 min-h-0.5 transition-colors rounded ${
											snapshot.isDraggingOver
												? "bg-blue-50/50 ring-1 ring-blue-200 ring-inset"
												: ""
										}`}
									>
										{unified.map((entry, unifiedIdx) => {
											const label = formatAgendaItemNumber(
												item.section,
												unifiedIdx,
												true,
											);
											if (entry.type === "doc") {
												return (
													<SessionDocumentRow
														key={entry.item.id}
														doc={entry.item}
														draggableIndex={unifiedIdx}
														numberLabel={label}
														{...docRowSharedProps}
														flushRef={getOrCreateDocFlushRef(entry.item.id)}
													/>
												);
											}
											const ct = entry.item as CustomTextItem;
											return (
												<SessionCustomTextRow
													key={ct.id}
													item={ct}
													numberLabel={label}
													draggableIndex={unifiedIdx}
													customIndex={entry.originalIndex}
													docCountInDroppable={documents.length}
													isRemoving={removingItemIds?.has(ct.id)}
													activeEditorId={resolveCustomTextActiveEditorId(
														ct.id,
													)}
													flushRef={getOrCreateFlushRef(ct.id)}
													{...customTextSharedProps}
												/>
											);
										})}
										{provided.placeholder}
									</div>
								)}
							</Droppable>
						);
					})()}

					{onAddDocument &&
						(isDndEnabled ? (
							dragDropZone(
								documents.length === 0 && customTexts.length === 0
									? item.id
									: `drop-zone::${item.id}`,
							)
						) : (
							<button
								type="button"
								onClick={() => onAddDocument(item.id)}
								className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-[#f3f3f5] px-3 py-1 text-sm text-gray-400 hover:bg-gray-200 hover:border-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
							>
								<GripVertical className="h-3.5 w-3.5" />
								<span>Drag a document here</span>
							</button>
						))}

					{onAddCustomText && (
						<SessionAddTextButton
							onClick={() => handleAddCustomText(item.id)}
						/>
					)}
				</>
			)}

			{/* Global Quill-compatible summary display styles */}
			<style jsx global>{`
				.summary-display { font-size: 0.75rem; line-height: 1.42; overflow-wrap: break-word; word-break: normal; }
				.summary-display p { margin: 0; padding: 0; }
				.summary-display ul, .summary-display ol { padding-left: 1.5em; margin: 0.2em 0; list-style-position: outside; }
				.summary-display li { display: list-item; margin: 0; padding-left: 0; }
				.summary-display ul > li { list-style-type: disc; }
				.summary-display ol > li { list-style-type: decimal; }
				.summary-display li.ql-indent-1 { padding-left: 2.5em; list-style-type: circle; }
				.summary-display li.ql-indent-2 { padding-left: 5em; list-style-type: square; }
				.summary-display strong { font-weight: 700; }
				.summary-display em { font-style: italic; }
				.summary-display u { text-decoration: underline; }
				.summary-display sup { vertical-align: super; font-size: 0.75em; line-height: 0; }
				.summary-display .ql-align-center { text-align: center; }
				.summary-display .ql-align-right { text-align: right; }
				.summary-display .ql-align-justify,
				.summary-display [style*="text-align: justify"] { text-align: justify; text-align-last: left; hyphens: auto; -webkit-hyphens: auto; word-spacing: -0.01em; }
			`}</style>
		</div>
	);
}
