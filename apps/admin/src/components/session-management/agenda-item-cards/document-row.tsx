import { Draggable } from "@hello-pangea/dnd";
import { Button } from "@repo/ui/components/button";
import {
	ExternalLink,
	FileText,
	GripVertical,
	Loader2,
	Pencil,
} from "@repo/ui/lib/lucide-react";
import parse from "html-react-parser";
import { sanitizeQuillHtml } from "@/utils/quill-html-utils.client";
import { RichTextEditor } from "../rich-text-editor";

export interface AgendaDocument {
	id: string;
	codeNumber: string;
	title: string;
	summary?: string;
	classification?: string;
	orderIndex?: number;
}

interface DocumentRowProps {
	doc: AgendaDocument;
	sectionId: string;
	draggableIndex: number;
	numberLabel: string | null;
	isDndEnabled?: boolean;
	editingSummaryId: string | null;
	summaryDraft: string;
	setSummaryDraft: (val: string) => void;
	removingItemIds?: Set<string>;
	onViewDocument?: (documentId: string) => void;
	onUpdateDocumentSummary?: (
		agendaItemId: string,
		documentId: string,
		summary: string,
	) => void;
	onRemoveDocument?: (agendaItemId: string, documentId: string) => void;
	onStartEditSummary: (doc: AgendaDocument) => void;
	onSaveSummary: (docId: string) => void;
	onCancelEditSummary: () => void;
}

export function DocumentRow({
	doc,
	sectionId,
	draggableIndex,
	numberLabel,
	isDndEnabled,
	editingSummaryId,
	summaryDraft,
	setSummaryDraft,
	removingItemIds,
	onViewDocument,
	onUpdateDocumentSummary,
	onRemoveDocument,
	onStartEditSummary,
	onSaveSummary,
	onCancelEditSummary,
}: DocumentRowProps) {
	const inner = (
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
			<div className="flex items-center justify-between p-2">
				{isDndEnabled && dragHandleProps && (
					<div
						{...dragHandleProps}
						className="flex items-center justify-center mr-1.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
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
							{doc.codeNumber}
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
							onClick={() => onStartEditSummary(doc)}
							className="text-gray-500 hover:text-blue-600 cursor-pointer"
							title={doc.summary ? "Edit public summary" : "Add public summary"}
						>
							<Pencil className="h-3.5 w-3.5" />
						</Button>
					)}
					{onRemoveDocument && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								!removingItemIds?.has(doc.id) &&
								onRemoveDocument(sectionId, doc.id)
							}
							disabled={removingItemIds?.has(doc.id)}
							className="text-gray-600 hover:text-red-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
						>
							{removingItemIds?.has(doc.id) ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								"Remove"
							)}
						</Button>
					)}
				</div>
			</div>

			{/* Summary display */}
			{doc.summary && editingSummaryId !== doc.id && (
				<div className="px-3 pb-2.5">
					<div className="flex items-start gap-1.5">
						<FileText className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
						<div className="min-w-0 flex-1">
							<p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide font-medium">
								Public summary
							</p>
							<div className="summary-display text-gray-700">
								{parse(sanitizeQuillHtml(doc.summary) ?? "")}
							</div>
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
						placeholder="e.g. CRN: DOC-RES-2024-019: Digital Transformation Resolution"
						maxLength={1000}
					/>
					<div className="flex items-center justify-end gap-1.5">
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
							onClick={onCancelEditSummary}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							className="cursor-pointer text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white"
							onClick={() => onSaveSummary(doc.id)}
						>
							Save Summary
						</Button>
					</div>
				</div>
			)}
		</div>
	);

	if (isDndEnabled) {
		const draggableId = `${sectionId}::${doc.id}`;
		return (
			<Draggable
				key={draggableId}
				draggableId={draggableId}
				index={draggableIndex}
			>
				{(provided, snapshot) => (
					<div
						ref={provided.innerRef}
						{...provided.draggableProps}
						style={provided.draggableProps.style}
					>
						{inner(
							provided.dragHandleProps as unknown as Record<string, unknown>,
							snapshot.isDragging,
						)}
					</div>
				)}
			</Draggable>
		);
	}
	return <div key={doc.id}>{inner()}</div>;
}
