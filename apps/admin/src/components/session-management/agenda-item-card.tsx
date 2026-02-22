import { Draggable, Droppable } from "@hello-pangea/dnd";
import type {
	SessionManagementAgendaItem as AgendaItem,
	SessionManagementSession,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Calendar as CalendarComponent } from "@repo/ui/components/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import {
	Calendar,
	ChevronDown,
	ExternalLink,
	FileText,
	GripVertical,
	Pencil,
} from "@repo/ui/lib/lucide-react";
import {
	formatAgendaItemNumber,
	getClassificationLabel,
	getSessionTypeLabel,
} from "@repo/ui/lib/session-ui";
import { format } from "date-fns";
import parse from "html-react-parser";
import { useState } from "react";
import { sanitizeQuillHtml } from "@/utils/quill-html-utils.client";
import { RichTextEditor } from "./rich-text-editor";

interface Document {
	id: string;
	key: string;
	title: string;
	summary?: string;
	classification?: string;
}

interface AgendaItemCardProps {
	item: AgendaItem;
	documents?: Document[];
	/** All sessions (for minutes picker) */
	sessions?: SessionManagementSession[];
	/** Current session being edited (excluded from minutes picker) */
	selectedSessionId?: string;
	/** Existing content text for this item */
	contentText?: string;
	/** Callback when content text changes */
	onContentTextChange?: (itemId: string, text: string) => void;
	onAddDocument?: (itemId: string) => void;
	onRemoveDocument?: (agendaItemId: string, documentId: string) => void;
	onUpdateDocumentSummary?: (
		agendaItemId: string,
		documentId: string,
		summary: string,
	) => void;
	/** Callback to open document viewer dialog */
	onViewDocument?: (documentId: string) => void;
	/** Whether drag-and-drop is enabled for documents */
	isDndEnabled?: boolean;
	/** Whether this item has unsaved changes */
	isModified?: boolean;
}

/** Format a date string (YYYY-MM-DD) to "Month DD, YYYY" */
function formatMinutesDate(dateStr: string): string {
	const [year, month, day] = dateStr.split("-");
	const d = new Date(Number(year), Number(month) - 1, Number(day));
	return d.toLocaleDateString("en-US", {
		month: "long",
		day: "2-digit",
		year: "numeric",
	});
}

const MINUTES_SECTION = "reading_and_or_approval_of_the_minutes";

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
}: AgendaItemCardProps) {
	const [editingSummaryId, setEditingSummaryId] = useState<string | null>(null);
	const [summaryDraft, setSummaryDraft] = useState("");

	// Custom minutes entry state
	const [isCustomMinutes, setIsCustomMinutes] = useState<boolean>(() => {
		return false;
	});

	// Parse customDate and customSessionType from contentText on mount so they
	// survive page reload. contentText format:
	// "Reading and/or approval of the Minutes of MMMM dd, yyyy SessionType"
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

	// Sessions eligible for minutes approval: only completed sessions, excluding current
	const minutesSessions = sessions.filter(
		(s) => s.id !== selectedSessionId && s.status === "completed",
	);

	// Derive whether the current contentText is a custom entry (not matching any known session).
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
		const dateFormatted = formatMinutesDate(session.date);
		const typeLabel = getSessionTypeLabel(session.type);
		const text = `Reading and/or approval of the Minutes of ${dateFormatted} ${typeLabel}`;
		onContentTextChange?.(item.id, text);
	};

	const handleCustomMinutesChange = (date: Date | undefined, type: string) => {
		const datePart = date ? format(date, "MMMM dd, yyyy") : "[date]";
		const typePart = type || "[session type]";
		const text = `Reading and/or approval of the Minutes of ${datePart} ${typePart}`;
		onContentTextChange?.(item.id, text);
	};

	/** Derive selected session ID from contentText (for controlled Select) */
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

	const handleStartEditSummary = (doc: Document) => {
		setEditingSummaryId(doc.id);
		setSummaryDraft(doc.summary ?? "");
	};

	const handleSaveSummary = (docId: string) => {
		onUpdateDocumentSummary?.(item.id, docId, summaryDraft);
		setEditingSummaryId(null);
		setSummaryDraft("");
	};

	const handleCancelEditSummary = () => {
		setEditingSummaryId(null);
		setSummaryDraft("");
	};

	const isCommitteeReports = item.section === "committee_reports";

	/** Group documents by classification for committee reports display */
	const groupedDocuments = (() => {
		if (!isCommitteeReports || documents.length === 0) return null;
		const groups: Record<string, Document[]> = {};
		for (const doc of documents) {
			const key = doc.classification || "uncategorized";
			if (!groups[key]) groups[key] = [];
			groups[key].push(doc);
		}
		return groups;
	})();

	/** Render a single document row with numbering indicator */
	const renderDocumentRow = (
		doc: Document,
		indexInSection: number,
		letterIndex?: number,
		sectionDocIndex?: number,
	) => {
		// Build the numbering indicator for this doc
		const numberLabel =
			isCommitteeReports && typeof letterIndex === "number"
				? `${String.fromCharCode(97 + letterIndex)}.`
				: typeof sectionDocIndex === "number"
					? formatAgendaItemNumber(item.section, sectionDocIndex, true)
					: null;

		const content = (
			dragHandleProps?: Record<string, unknown>,
			isDragging?: boolean,
		) => (
			<div
				className={`rounded-md border overflow-hidden transition-shadow ${
					isDragging
						? "border-blue-400 bg-blue-50 shadow-lg ring-2 ring-blue-200"
						: "border-gray-200 bg-gray-50"
				}`}
			>
				{/* Numbering + doc info header */}
				<div className="flex items-center justify-between p-2">
					{/* Drag handle */}
					{isDndEnabled && dragHandleProps && (
						<div
							{...dragHandleProps}
							className="flex items-center justify-center mr-1.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
							title="Drag to reorder"
						>
							<GripVertical className="h-4 w-4" />
						</div>
					)}
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-1.5">
							{numberLabel && (
								<span className="text-xs font-semibold text-gray-500 bg-gray-200 rounded px-1.5 py-0.5 shrink-0">
									{numberLabel}
								</span>
							)}
							<p className="text-sm font-medium text-gray-900 truncate">
								{doc.key}
							</p>
						</div>
						<p className="text-sm text-gray-600 truncate mt-0.5">{doc.title}</p>
					</div>
					<div className="flex items-center gap-1 ml-2">
						{onViewDocument && (
							<button
								type="button"
								onClick={() => onViewDocument(doc.id)}
								className="inline-flex items-center justify-center rounded-md text-gray-500 hover:text-[#a60202] hover:bg-red-50 h-8 w-8 transition-colors cursor-pointer"
								title="View document"
							>
								<ExternalLink className="h-3.5 w-3.5" />
							</button>
						)}
						{onUpdateDocumentSummary && editingSummaryId !== doc.id && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleStartEditSummary(doc)}
								className="text-gray-500 hover:text-blue-600 cursor-pointer"
								title={
									doc.summary ? "Edit public summary" : "Add public summary"
								}
							>
								<Pencil className="h-3.5 w-3.5" />
							</Button>
						)}
						{onRemoveDocument && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onRemoveDocument(item.id, doc.id)}
								className="text-gray-600 hover:text-red-600 cursor-pointer"
							>
								Remove
							</Button>
						)}
					</div>
				</div>

				{/* Summary display (when not editing) */}
				{doc.summary && editingSummaryId !== doc.id && (
					<div className="px-3 pb-2.5">
						<div className="flex items-start gap-1.5">
							<FileText className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
							<div className="min-w-0 flex-1">
								<p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide font-medium">
									Public summary
								</p>
								{/* html-react-parser replaces dangerouslySetInnerHTML.        */}
								{/* It converts the HTML string into real React elements so    */}
								{/* there is no raw HTML injection — XSS-safe by construction. */}
								<div className="summary-display text-gray-700">
									{parse(sanitizeQuillHtml(doc.summary) ?? "")}
								</div>
								<style jsx global>{`
								/*
								 * Mirrors the Quill snow editor so the public summary looks
								 * identical to what the user typed in the editor.
								 */

								/* ── Base ──────────────────────────────────────── */
								.summary-display {
									font-size: 0.75rem;
									line-height: 1.42;
									overflow-wrap: break-word;
									word-break: normal;
								}

								/* ── Paragraphs ─────────────────────────────────── */
								/* Every line is wrapped in <p>. Empty lines are     */
								/* <p><br></p> and must render as a full blank line. */
								.summary-display p {
									margin: 0;
									padding: 0;
								}

								/* ── Text indentation on <p> (ql-indent-N classes) ─ */
								/* 3em per level, matching Quill snow default          */
								.summary-display .ql-indent-1:not(li) { padding-left: 3em; }
								.summary-display .ql-indent-2:not(li) { padding-left: 6em; }
								.summary-display .ql-indent-3:not(li) { padding-left: 9em; }
								.summary-display .ql-indent-4:not(li) { padding-left: 12em; }
								.summary-display .ql-indent-5:not(li) { padding-left: 15em; }
								.summary-display .ql-indent-6:not(li) { padding-left: 18em; }
								.summary-display .ql-indent-7:not(li) { padding-left: 21em; }
								.summary-display .ql-indent-8:not(li) { padding-left: 24em; }

								/* ── Lists ──────────────────────────────────────── */
								/*
								 * Root fix: give ul/ol a proper left padding so the bullet
								 * marker has room to render OUTSIDE the text column.
								 * list-style-position: outside (default) means markers sit in
								 * the padding area — so the container needs the space.
								 * Setting padding-left: 0 (old) collapsed that space and pushed
								 * bullets into the text, causing the wide-indent visual bug.
								 */
								.summary-display ul,
								.summary-display ol {
									padding-left: 1.5em;
									margin: 0.2em 0;
									list-style-position: outside;
								}
								.summary-display li {
									display: list-item;
									margin: 0;
									padding-left: 0;
								}
								.summary-display ul > li { list-style-type: disc; }
								.summary-display ol > li { list-style-type: decimal; }

								/* ── List indentation (ql-indent-N on <li>) ─────── */
								/* Quill snow: base 1.5em + 2.5em per indent level.  */
								/* We use padding-left on the <li> itself so the      */
								/* marker stays at the correct column.               */
								.summary-display li.ql-indent-1 { padding-left: 2.5em;  list-style-type: circle;  }
								.summary-display li.ql-indent-2 { padding-left: 5em;    list-style-type: square;  }
								.summary-display li.ql-indent-3 { padding-left: 7.5em;  list-style-type: disc;    }
								.summary-display li.ql-indent-4 { padding-left: 10em;   list-style-type: circle;  }
								.summary-display li.ql-indent-5 { padding-left: 12.5em; list-style-type: square;  }
								.summary-display li.ql-indent-6 { padding-left: 15em;   list-style-type: disc;    }
								.summary-display li.ql-indent-7 { padding-left: 17.5em; list-style-type: circle;  }
								.summary-display li.ql-indent-8 { padding-left: 20em;   list-style-type: square;  }

								/* ── Inline formatting ──────────────────────────── */
								.summary-display strong { font-weight: 700; }
								.summary-display em     { font-style: italic; }
								.summary-display u      { text-decoration: underline; }
								.summary-display s      { text-decoration: line-through; }
								.summary-display sup    { vertical-align: super; font-size: 0.75em; line-height: 0; }
								.summary-display sub    { vertical-align: sub;   font-size: 0.75em; line-height: 0; }

								/* ── Alignment (sanitizeQuillHtml sets inline style) */
								.summary-display .ql-align-center  { text-align: center; }
								.summary-display .ql-align-right   { text-align: right; }
								.summary-display .ql-align-justify,
								.summary-display [style*="text-align: justify"] {
									text-align: justify;
									text-align-last: left;
									hyphens: auto;
									-webkit-hyphens: auto;
									word-spacing: -0.01em;
								}
								`}</style>
							</div>
						</div>
					</div>
				)}

				{/* Summary editor */}
				{editingSummaryId === doc.id && (
					<div className="px-3 pb-3 space-y-2 border-t border-gray-200 pt-2 bg-blue-50/50">
						<label className="text-xs font-medium text-gray-700">
							Public Summary
						</label>
						<p className="text-[10px] text-gray-400 leading-snug">
							Write a short summary for the public portal. If left empty, the
							document title will be shown instead.
						</p>
						<RichTextEditor
							value={summaryDraft}
							onChange={setSummaryDraft}
							placeholder="e.g. CRN: DOC-RES-2024-019: Digital Transformation and IT Infrastructure Resolution"
							maxLength={1000}
						/>
						<div className="flex items-center justify-end">
							<div className="flex gap-1.5">
								{summaryDraft.length > 0 && (
									<Button
										variant="ghost"
										size="sm"
										className="cursor-pointer text-xs h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
										onClick={() => setSummaryDraft("")}
									>
										Clear All
									</Button>
								)}
								<Button
									variant="ghost"
									size="sm"
									className="cursor-pointer text-xs h-7"
									onClick={handleCancelEditSummary}
								>
									Cancel
								</Button>
								<Button
									size="sm"
									className="cursor-pointer text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white"
									onClick={() => handleSaveSummary(doc.id)}
								>
									Save Summary
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		);

		if (isDndEnabled) {
			const uniqueDraggableId = `${item.id}::${doc.id}`;
			return (
				<Draggable
					key={uniqueDraggableId}
					draggableId={uniqueDraggableId}
					index={indexInSection}
				>
					{(provided, snapshot) => (
						<div
							ref={provided.innerRef}
							{...provided.draggableProps}
							style={provided.draggableProps.style}
						>
							{content(
								provided.dragHandleProps as unknown as Record<string, unknown>,
								snapshot.isDragging,
							)}
						</div>
					)}
				</Draggable>
			);
		}

		return <div key={doc.id}>{content()}</div>;
	};

	return (
		<div
			className={`flex flex-col gap-3 rounded-lg border p-4 bg-white transition-all duration-300 ${
				isModified
					? "border-l-amber-400 border-l-[3px] border-gray-200"
					: "border-gray-200"
			}`}
		>
			<div className="flex items-center justify-between">
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
			</div>

			{/* Minutes Session Picker (draft) or read-only display (scheduled/completed) */}
			{isMinutesSection && onContentTextChange && (
				<div className="space-y-1.5">
					<label className="text-xs font-medium text-gray-600">
						Select session minutes to approve
					</label>
					<Select
						value={derivedMinutesSessionId}
						onValueChange={handleMinutesSessionSelect}
					>
						<SelectTrigger className="w-full cursor-pointer">
							<SelectValue placeholder="Choose a session…" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem
								value="__none__"
								className="cursor-pointer text-gray-400"
							>
								None
							</SelectItem>
							{minutesSessions.map((s) => (
								<SelectItem key={s.id} value={s.id} className="cursor-pointer">
									<div className="flex items-center gap-2">
										<span>
											{formatMinutesDate(s.date)} —{" "}
											{getSessionTypeLabel(s.type)}
										</span>
										<span className="inline-flex items-center rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
											Completed
										</span>
									</div>
								</SelectItem>
							))}
							<SelectItem
								value="__custom__"
								className="cursor-pointer text-blue-600"
							>
								Enter custom date &amp; session type…
							</SelectItem>
						</SelectContent>
					</Select>

					{/* Custom date + session type inputs */}
					{isCustomMinutesResolved && (
						<div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-3">
							<div className="flex-1 space-y-1">
								<label className="text-xs font-medium text-gray-600">
									Date
								</label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className="w-full justify-start text-left font-normal cursor-pointer bg-white"
										>
											<Calendar className="mr-2 h-4 w-4" />
											{customDate ? format(customDate, "PPP") : "Pick a date"}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<CalendarComponent
											mode="single"
											selected={customDate}
											onSelect={(date) => {
												setCustomDate(date);
												handleCustomMinutesChange(date, customSessionType);
											}}
											defaultMonth={customDate ?? new Date()}
											captionLayout="dropdown"
											fromYear={2000}
											toYear={new Date().getFullYear()}
											classNames={{
												today: "bg-transparent text-yellow-400 font-normal",
												day_selected:
													"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
											}}
										/>
									</PopoverContent>
								</Popover>
							</div>
							<div className="flex-1 space-y-1">
								<label className="text-xs font-medium text-gray-600">
									Session type
								</label>
								<Select
									value={customSessionType || "__none__"}
									onValueChange={(val) => {
										const type = val === "__none__" ? "" : val;
										setCustomSessionType(type);
										handleCustomMinutesChange(customDate, type);
									}}
								>
									<SelectTrigger className="w-full cursor-pointer bg-white">
										<SelectValue placeholder="Select type…" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem
											value="__none__"
											className="cursor-pointer text-gray-400"
										>
											Select type…
										</SelectItem>
										<SelectItem
											value="Regular Session"
											className="cursor-pointer"
										>
											Regular Session
										</SelectItem>
										<SelectItem
											value="Special Session"
											className="cursor-pointer"
										>
											Special Session
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					)}
					{contentText && (
						<div className="text-xs text-gray-500 italic mt-1">
							<span>Preview: </span>
							{/* Plain text only here — no HTML formatting needed */}
							<span>{contentText}</span>
						</div>
					)}
				</div>
			)}

			{isMinutesSection && !onContentTextChange && contentText && (
				<div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
					<div className="text-sm text-gray-700">
						{parse(sanitizeQuillHtml(contentText) ?? "")}
					</div>
				</div>
			)}

			{/* Committee Reports: Grouped by Classification */}
			{isCommitteeReports && groupedDocuments && (
				<Droppable droppableId={item.id} isDropDisabled={!isDndEnabled}>
					{(provided, snapshot) => (
						<div
							ref={provided.innerRef}
							{...provided.droppableProps}
							className={`flex flex-col gap-4 min-h-[2px] transition-colors rounded ${
								snapshot.isDraggingOver
									? "bg-blue-50/50 ring-1 ring-blue-200 ring-inset"
									: ""
							}`}
						>
							{(() => {
								let globalIdx = 0;
								return Object.entries(groupedDocuments).map(
									([classification, docs], groupIndex) => (
										<div key={classification} className="flex flex-col gap-2">
											<h5 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
												{groupIndex + 1}. COMMITTEE ON{" "}
												{getClassificationLabel(classification).toUpperCase()}
											</h5>
											<div className="flex flex-col gap-2 ml-4">
												{docs.map((doc, docIndex) => {
													const idx = globalIdx++;
													return renderDocumentRow(
														doc,
														idx,
														docIndex,
														undefined,
													);
												})}
											</div>
										</div>
									),
								);
							})()}
							{provided.placeholder}
						</div>
					)}
				</Droppable>
			)}

			{/* Non-committee Attached Documents */}
			{!isCommitteeReports && documents.length > 0 && (
				<Droppable droppableId={item.id} isDropDisabled={!isDndEnabled}>
					{(provided, snapshot) => (
						<div
							ref={provided.innerRef}
							{...provided.droppableProps}
							className={`flex flex-col gap-2 min-h-[2px] transition-colors rounded ${
								snapshot.isDraggingOver
									? "bg-blue-50/50 ring-1 ring-blue-200 ring-inset"
									: ""
							}`}
						>
							{documents.map((doc, docIndex) =>
								renderDocumentRow(doc, docIndex, undefined, docIndex),
							)}
							{provided.placeholder}
						</div>
					)}
				</Droppable>
			)}

			{/* Drag a document here */}
			{onAddDocument &&
				(documents.length === 0 && isDndEnabled ? (
					<Droppable droppableId={item.id}>
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
		</div>
	);
}
