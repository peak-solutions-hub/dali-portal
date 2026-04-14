import { Draggable } from "@hello-pangea/dnd";
import { CustomTextItem } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	FileText,
	GripVertical,
	Loader2,
	Pencil,
} from "@repo/ui/lib/lucide-react";
import parse from "html-react-parser";
import { useEffect, useId, useRef, useState } from "react";
import { sanitizeQuillHtml } from "@/utils/session-helpers";
import { SessionRichTextEditor } from "../session-rich-text-editor";

interface SessionCustomTextRowProps {
	item: CustomTextItem;
	numberLabel: string;
	sectionId: string;
	onUpdate: (sectionId: string, id: string, content: string) => void;
	onRemove: (sectionId: string, id: string) => void;
	isDndEnabled?: boolean;
	/** Position within the unified droppable (for @hello-pangea/dnd index) */
	draggableIndex?: number;
	/** Index within the custom-texts sub-array — encoded in draggableId so
	 *  handleDragEnd can read source/dest indices without computing offsets */
	customIndex?: number;
	/** Number of document rows that appear before custom text rows in this droppable. */
	docCountInDroppable?: number;
	/** When true the edit button is hidden; the remove button is still shown */
	isReadOnly?: boolean;
	/** When true the remove button shows a spinner (item is mid-API-call) */
	isRemoving?: boolean;
	/** When true, disables this row's Remove button without showing a spinner.
	 *  Used to block concurrent removes while another item is mid-API-call. */
	isRemovingAny?: boolean;
	/** The currently active editor ID — if set and !== item.id, this row collapses */
	activeEditorId?: string | null;
	/** Called when this row opens its editor */
	onEditorFocus?: (id: string) => void;
	/** If provided, registers a flush fn while editing so save/publish can commit the draft. */
	flushRef?: React.MutableRefObject<(() => void) | null>;
}

export function SessionCustomTextRow({
	item,
	numberLabel,
	sectionId,
	onUpdate,
	onRemove,
	isDndEnabled,
	draggableIndex,
	customIndex,
	docCountInDroppable = 0,
	isReadOnly,
	isRemoving,
	isRemovingAny,
	activeEditorId,
	onEditorFocus,
	flushRef,
}: SessionCustomTextRowProps) {
	const customTextEditorLabelId = useId();
	const isEditing =
		activeEditorId === item.id ||
		(!item.content && !isReadOnly && activeEditorId === undefined);
	const [draft, setDraft] = useState(item.content);

	const isEmpty = !draft || draft.replace(/<[^>]*>/g, "").trim().length === 0;

	// Stable ref so the flush fn always sees the latest typed value
	const draftRef = useRef(draft);
	useEffect(() => {
		draftRef.current = draft;
	}, [draft]);

	// Register/unregister flush fn while this editor is open
	useEffect(() => {
		if (!flushRef) return;
		if (isEditing) {
			flushRef.current = () => {
				const current = draftRef.current;
				const hasContent =
					current && current.replace(/<[^>]*>/g, "").trim().length > 0;
				if (hasContent) {
					const isDirty = current !== (item.content ?? "");
					if (isDirty) {
						onUpdate(sectionId, item.id, current);
					}
					return isDirty; // only signal a real change when content actually differs
				} else if (!item.content) {
					// Empty new item (never saved) — auto-discard on flush (e.g. publish/save)
					onRemove(sectionId, item.id);
				}
				// Empty but already-saved item: leave as-is (content stays unchanged)
				return false;
			};
		} else {
			flushRef.current = null;
		}
		return () => {
			if (flushRef) flushRef.current = null;
		};
	}, [
		isEditing,
		flushRef,
		onUpdate,
		onRemove,
		sectionId,
		item.id,
		item.content,
	]);

	const handleOpenEditor = () => {
		setDraft(item.content);
		onEditorFocus?.(item.id);
	};

	const handleSave = () => {
		if (isEmpty) return;
		onUpdate(sectionId, item.id, draft);
		onEditorFocus?.("");
	};

	const handleCancel = () => {
		// If the item was newly added (no saved content), remove it entirely on cancel
		if (!item.content) {
			onRemove(sectionId, item.id);
			return;
		}
		setDraft(item.content);
		onEditorFocus?.("");
	};

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
			{/* Header — identical structure to document row */}
			<div className="flex items-center justify-between p-2">
				{isDndEnabled && dragHandleProps && (
					<div
						{...dragHandleProps}
						className="flex items-center justify-center mr-1.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
					>
						<GripVertical className="h-4 w-4" aria-hidden="true" />
					</div>
				)}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-1.5">
						{numberLabel && (
							<span className="text-xs font-semibold text-gray-500 bg-gray-200 rounded px-1.5 py-0.5 shrink-0">
								{numberLabel}
							</span>
						)}
					</div>
				</div>
				<div className="flex items-center gap-1 ml-2">
					{!isEditing && !isReadOnly && (
						<Button
							variant="ghost"
							size="sm"
							aria-label="Edit custom text"
							onClick={handleOpenEditor}
							className="text-gray-500 hover:text-blue-600 cursor-pointer"
							title="Edit custom text"
						>
							<Pencil className="h-3.5 w-3.5" aria-hidden="true" />
						</Button>
					)}
					<Button
						variant="ghost"
						size="sm"
						onClick={() =>
							!isRemoving && !isRemovingAny && onRemove(sectionId, item.id)
						}
						disabled={isRemoving || isRemovingAny}
						className="text-gray-600 hover:text-red-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
					>
						{isRemoving ? (
							<Loader2
								className="h-3.5 w-3.5 animate-spin"
								aria-hidden="true"
							/>
						) : (
							"Remove"
						)}
					</Button>
				</div>
			</div>

			{/* Content display — padding matches editor ql-editor for consistent line breaks */}
			{!isEditing && item.content && (
				<div className="px-3 pb-2.5">
					<p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide font-medium flex items-center gap-1">
						<FileText
							className="h-3 w-3 text-blue-500 shrink-0"
							aria-hidden="true"
						/>
						Custom text
					</p>
					<div className="summary-display text-gray-700 ql-editor py-0! px-2.20! border-x border-transparent">
						{parse(sanitizeQuillHtml(item.content) ?? "")}
					</div>
				</div>
			)}

			{/* Editor — same blue bg style as public summary editor */}
			{isEditing && (
				<div className="px-3 pb-3 space-y-2 border-t border-gray-200 pt-2 bg-blue-50/50">
					<label
						id={customTextEditorLabelId}
						className="text-xs font-medium text-gray-700"
					>
						Custom Text
					</label>
					<div role="group" aria-labelledby={customTextEditorLabelId}>
						<SessionRichTextEditor
							value={draft}
							onChange={setDraft}
							placeholder="Enter custom text…"
						/>
					</div>
					<div className="flex items-center justify-end gap-1.5">
						{!isEmpty && (
							<Button
								variant="ghost"
								size="sm"
								className="cursor-pointer text-xs h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
								onClick={() => setDraft("")}
							>
								Clear All
							</Button>
						)}
						<Button
							variant="ghost"
							size="sm"
							className="cursor-pointer text-xs h-7"
							onClick={handleCancel}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							disabled={isEmpty}
							className="cursor-pointer text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
							onClick={handleSave}
						>
							Save Text
						</Button>
					</div>
				</div>
			)}
		</div>
	);

	if (isDndEnabled && draggableIndex !== undefined) {
		// draggableId format: "custom::<sectionId>::<customIndex>::<docCount>::<itemId>"
		// customIndex  = position within the custom-texts sub-array (used as sourceIndex)
		// docCount     = number of doc rows before custom texts in this droppable
		//               (used in handleDragEnd to convert droppable dest index → sub-array dest index)
		const encodedCustomIndex = customIndex ?? 0;
		const encodedDocCount = docCountInDroppable ?? 0;
		const draggableId = `custom::${sectionId}::${encodedCustomIndex}::${encodedDocCount}::${item.id}`;
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
	return <div key={item.id}>{inner()}</div>;
}
