import type { SessionManagementAgendaItem as AgendaItem } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { ChevronDown, FileText, Pencil, X } from "@repo/ui/lib/lucide-react";
import { useState } from "react";
import { RichTextEditor } from "./rich-text-editor";

interface Document {
	id: string;
	key: string;
	title: string;
	summary?: string;
}

interface AgendaItemCardProps {
	item: AgendaItem;
	documents?: Document[];
	onAddDocument?: (itemId: string) => void;
	onRemoveDocument?: (agendaItemId: string, documentId: string) => void;
	onUpdateDocumentSummary?: (
		agendaItemId: string,
		documentId: string,
		summary: string,
	) => void;
}

export function AgendaItemCard({
	item,
	documents = [],
	onAddDocument,
	onRemoveDocument,
	onUpdateDocumentSummary,
}: AgendaItemCardProps) {
	const [editingSummaryId, setEditingSummaryId] = useState<string | null>(null);
	const [summaryDraft, setSummaryDraft] = useState("");

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

	return (
		<div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 bg-white">
			<h4 className="text-base font-medium text-gray-900 leading-6">
				{item.title}
			</h4>

			{/* Attached Documents */}
			{documents.length > 0 && (
				<div className="flex flex-col gap-2">
					{documents.map((doc: Document) => (
						<div
							key={doc.id}
							className="rounded-md border border-gray-200 bg-gray-50 overflow-hidden"
						>
							<div className="flex items-center justify-between p-2">
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-gray-900">{doc.key}</p>
									<p className="text-sm text-gray-600 truncate">{doc.title}</p>
								</div>
								<div className="flex items-center gap-1 ml-2">
									{onUpdateDocumentSummary && editingSummaryId !== doc.id && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleStartEditSummary(doc)}
											className="text-gray-500 hover:text-blue-600 cursor-pointer"
											title={
												doc.summary
													? "Edit public summary"
													: "Add public summary"
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
										<div
											className="text-xs text-gray-600 leading-relaxed [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4"
											dangerouslySetInnerHTML={{ __html: doc.summary }}
										/>
									</div>
									<p className="text-[10px] text-gray-400 mt-1 ml-5">
										Public summary — visible to attendees
									</p>
								</div>
							)}

							{/* Summary editor */}
							{editingSummaryId === doc.id && (
								<div className="px-3 pb-3 space-y-2 border-t border-gray-200 pt-2 bg-blue-50/50">
									<label className="text-xs font-medium text-gray-700">
										Public Summary
									</label>
									<RichTextEditor
										value={summaryDraft}
										onChange={setSummaryDraft}
										placeholder="Write a short, paragraph-length description for the public. Only this text will be shown publicly — the document itself is not visible."
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
					))}
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
