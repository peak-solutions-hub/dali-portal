import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import type {
	SessionManagementDocument as Document,
	SessionManagementAgendaItem,
	SessionManagementSession,
} from "@repo/shared";
import { AgendaDocument, CustomTextItem } from "@repo/shared";
import { AgendaItemCard } from "../session-agenda-item-card";

interface SessionAgendaItemListProps {
	agendaItems: SessionManagementAgendaItem[];
	documentsByAgendaItem: Record<string, AgendaDocument[]>;
	customTextsBySection?: Record<string, CustomTextItem[]>;
	contentTextMap?: Record<string, string>;
	sessions: SessionManagementSession[];
	selectedSessionId?: string;
	isDraft: boolean;
	isCompleted: boolean;
	isScheduled: boolean;
	changedSections?: Set<string>;
	removingItemIds?: Set<string>;
	/** True when any item in the session is mid-remove — disables all Remove buttons */
	isRemovingAny?: boolean;
	onDndReorder?: (
		sourceSectionId: string,
		destSectionId: string,
		sourceIndex: number,
		destIndex: number,
	) => void;
	onContentTextChange?: (itemId: string, text: string) => void;
	onAddDocument?: (agendaItemId: string) => void;
	onRemoveDocument?: (agendaItemId: string, documentId: string) => void;
	onUpdateDocumentSummary?: (
		agendaItemId: string,
		documentId: string,
		summary: string,
	) => void;
	onViewDocument?: (documentId: string) => void;
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
	getOrCreateCardFlushRef: (
		itemId: string,
	) => React.MutableRefObject<(() => void) | null>;
	onCardEditorOpen: (itemId: string) => void;
	onDragEnd: (result: DropResult) => void;
	onDragOver: (e: React.DragEvent, itemId: string) => void;
	onDragLeave: (e: React.DragEvent) => void;
	onDropDocument: (agendaItemId: string, doc: Document) => void;
}

export function SessionAgendaItemList({
	agendaItems,
	documentsByAgendaItem,
	customTextsBySection,
	contentTextMap,
	sessions,
	selectedSessionId,
	isDraft,
	isCompleted,
	isScheduled,
	changedSections,
	removingItemIds,
	onContentTextChange,
	onAddDocument,
	onRemoveDocument,
	onUpdateDocumentSummary,
	onViewDocument,
	onAddCustomText,
	onUpdateCustomText,
	onRemoveCustomText,
	onReorderCustomTexts,
	onDndReorder,
	getOrCreateCardFlushRef,
	onCardEditorOpen,
	onDragEnd,
	onDragOver,
	onDragLeave,
	onDropDocument,
}: SessionAgendaItemListProps) {
	return (
		<DragDropContext onDragEnd={onDragEnd}>
			<div className="flex-1 overflow-y-auto min-h-0">
				<div className="flex flex-col gap-3">
					{agendaItems.map((item) => {
						// True if any item anywhere in the session is mid-remove.
						// Passed down so every Remove button disables, not just the active one.
						const isRemovingAny = (removingItemIds?.size ?? 0) > 0;

						return (
							<div
								key={item.id}
								onDragOver={(e) => isDraft && onDragOver(e, item.id)}
								onDragLeave={isDraft ? onDragLeave : undefined}
								onDrop={(e) => {
									if (isDraft) {
										e.preventDefault();
										e.currentTarget.classList.remove(
											"bg-blue-50",
											"border-blue-300",
										);
										const data = e.dataTransfer.getData("application/json");
										if (data) onDropDocument(item.id, JSON.parse(data));
									}
								}}
								className={`transition-colors rounded-lg ${isCompleted ? "opacity-75" : ""}`}
							>
								<AgendaItemCard
									item={item}
									documents={documentsByAgendaItem[item.id]}
									sessions={sessions}
									selectedSessionId={selectedSessionId}
									contentText={contentTextMap?.[item.id]}
									onContentTextChange={
										isDraft ? onContentTextChange : undefined
									}
									onAddDocument={isDraft ? onAddDocument : undefined}
									onRemoveDocument={isCompleted ? undefined : onRemoveDocument}
									onUpdateDocumentSummary={
										isDraft ? onUpdateDocumentSummary : undefined
									}
									onViewDocument={onViewDocument}
									isDndEnabled={isDraft && !!onDndReorder}
									isModified={changedSections?.has(item.id)}
									removingItemIds={removingItemIds}
									isRemovingAny={isRemovingAny}
									customTexts={customTextsBySection?.[item.id]}
									onAddCustomText={isDraft ? onAddCustomText : undefined}
									onUpdateCustomText={isDraft ? onUpdateCustomText : undefined}
									onRemoveCustomText={
										!isCompleted ? onRemoveCustomText : undefined
									}
									onReorderCustomTexts={
										isDraft ? onReorderCustomTexts : undefined
									}
									isCustomTextReadOnly={!isDraft}
									flushRef={getOrCreateCardFlushRef(item.id)}
									onEditorOpen={() => onCardEditorOpen(item.id)}
								/>
							</div>
						);
					})}
				</div>
			</div>
		</DragDropContext>
	);
}
