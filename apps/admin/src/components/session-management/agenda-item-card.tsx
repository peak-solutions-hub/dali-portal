import type {
	SessionManagementAgendaItem as AgendaItem,
	SessionManagementSession,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import {
	ChevronDown,
	ExternalLink,
	FileText,
	Pencil,
	X,
} from "@repo/ui/lib/lucide-react";
import {
	formatAgendaItemNumber,
	getClassificationLabel,
	getSessionTypeLabel,
} from "@repo/ui/lib/session-ui";
import Link from "next/link";
import { useState } from "react";
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
}: AgendaItemCardProps) {
	const [editingSummaryId, setEditingSummaryId] = useState<string | null>(null);
	const [summaryDraft, setSummaryDraft] = useState("");

	const isMinutesSection = item.section === MINUTES_SECTION;

	// Sessions eligible for minutes approval: only completed sessions, excluding current
	const minutesSessions = sessions.filter(
		(s) => s.id !== selectedSessionId && s.status === "completed",
	);

	const handleMinutesSessionSelect = (sessionId: string) => {
		if (sessionId === "__none__") {
			onContentTextChange?.(item.id, "");
			return;
		}
		const session = sessions.find((s) => s.id === sessionId);
		if (!session) return;
		const dateFormatted = formatMinutesDate(session.date);
		const typeLabel = getSessionTypeLabel(session.type);
		const text = `Reading and/or approval of the Minutes of ${dateFormatted} ${typeLabel}`;
		onContentTextChange?.(item.id, text);
	};

	/** Derive selected session ID from contentText (for controlled Select) */
	const derivedMinutesSessionId = (() => {
		if (!contentText || !isMinutesSection) return undefined;
		return minutesSessions.find((s) => {
			const dateFormatted = formatMinutesDate(s.date);
			const typeLabel = getSessionTypeLabel(s.type);
			return (
				contentText.includes(dateFormatted) && contentText.includes(typeLabel)
			);
		})?.id;
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

		return (
			<div
				key={doc.id}
				className="rounded-md border border-gray-200 bg-gray-50 overflow-hidden"
			>
				{/* Numbering + doc info header */}
				<div className="flex items-center justify-between p-2">
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
							<div>
								<p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide font-medium">
									Public summary
								</p>
								<div
									className="text-xs text-gray-700 leading-relaxed [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4"
									dangerouslySetInnerHTML={{ __html: doc.summary }}
								/>
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
	};

	return (
		<div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 bg-white">
			<h4 className="text-base font-medium text-gray-900 leading-6">
				{item.title}
			</h4>

			{/* Minutes Session Picker (draft) or read-only display (scheduled/completed) */}
			{isMinutesSection && onContentTextChange && (
				<div className="space-y-1.5">
					<label className="text-xs font-medium text-gray-600">
						Select session minutes to approve
					</label>
					<Select
						value={derivedMinutesSessionId ?? "__none__"}
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
									{formatMinutesDate(s.date)} — {getSessionTypeLabel(s.type)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{contentText && (
						<p className="text-xs text-gray-500 italic mt-1">
							Preview: {contentText}
						</p>
					)}
				</div>
			)}
			{isMinutesSection && !onContentTextChange && contentText && (
				<div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
					<p className="text-sm text-gray-700">{contentText}</p>
				</div>
			)}

			{/* Committee Reports: Grouped by Classification */}
			{isCommitteeReports && groupedDocuments && (
				<div className="flex flex-col gap-4">
					{Object.entries(groupedDocuments).map(
						([classification, docs], groupIndex) => (
							<div key={classification} className="flex flex-col gap-2">
								<h5 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
									{groupIndex + 1}. COMMITTEE ON{" "}
									{getClassificationLabel(classification).toUpperCase()}
								</h5>
								<div className="flex flex-col gap-2 ml-4">
									{docs.map((doc, docIndex) =>
										renderDocumentRow(doc, docIndex, undefined),
									)}
								</div>
							</div>
						),
					)}
				</div>
			)}

			{/* Non-committee Attached Documents */}
			{!isCommitteeReports && documents.length > 0 && (
				<div className="flex flex-col gap-2">
					{documents.map((doc, docIndex) =>
						renderDocumentRow(doc, undefined, docIndex),
					)}
				</div>
			)}

			{/* Add Document Button - hidden when locked */}
			{onAddDocument && (
				<button
					type="button"
					onClick={() => onAddDocument(item.id)}
					className="flex h-9 w-full items-center justify-between rounded-md bg-[#f3f3f5] px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
				>
					<span>+ Add document</span>
					<ChevronDown className="h-4 w-4" />
				</button>
			)}
		</div>
	);
}
