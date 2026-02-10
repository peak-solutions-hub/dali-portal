"use client";

import { Bold, Italic, List, Underline } from "@repo/ui/lib/lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface RichTextEditorProps {
	value: string;
	onChange: (html: string) => void;
	maxLength?: number;
	placeholder?: string;
}

export function RichTextEditor({
	value,
	onChange,
	maxLength = 1000,
	placeholder,
}: RichTextEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const [textLength, setTextLength] = useState(0);
	const isInternalUpdate = useRef(false);

	// Set initial content and sync when value changes externally
	useEffect(() => {
		if (isInternalUpdate.current) {
			isInternalUpdate.current = false;
			return;
		}
		if (editorRef.current && editorRef.current.innerHTML !== value) {
			editorRef.current.innerHTML = value;
			setTextLength(editorRef.current.textContent?.length ?? 0);
		}
	}, [value]);

	const handleInput = useCallback(() => {
		if (!editorRef.current) return;
		const html = editorRef.current.innerHTML;
		const text = editorRef.current.textContent ?? "";
		setTextLength(text.length);
		isInternalUpdate.current = true;
		// Normalize empty states — only match browser-generated empty patterns.
		// Do NOT use text.trim() === "" because it strips list structures (<ul>, <ol>).
		const isEmpty =
			!html ||
			html === "<br>" ||
			html === "<div><br></div>" ||
			html === "<p><br></p>";
		onChange(isEmpty ? "" : html);
	}, [onChange]);

	// Handle Enter key:
	// 1. If inside an empty <li>, break out of the list
	// 2. If on a line with text containing a space, auto-create bullet list
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (e.key !== "Enter") return;

			const sel = window.getSelection();
			if (!sel || sel.rangeCount === 0) return;

			// Walk up from the cursor to see if we're inside a <li>
			let node: Node | null = sel.anchorNode;
			let li: HTMLLIElement | null = null;
			let inList = false;
			while (node && node !== editorRef.current) {
				if (node.nodeType === Node.ELEMENT_NODE) {
					const tag = (node as HTMLElement).tagName;
					if (tag === "LI") {
						li = node as HTMLLIElement;
						inList = true;
						break;
					}
					if (tag === "UL" || tag === "OL") {
						inList = true;
						break;
					}
				}
				node = node.parentNode;
			}

			// Case 1: Inside a list item - check if empty to break out
			if (li) {
				const liText = (li.textContent ?? "").replace(/\u200B/g, "").trim();
				if (liText === "") {
					e.preventDefault();
					// Remove the empty <li> and break out of the list
					document.execCommand("insertUnorderedList", false);
					// Insert a line break so the cursor moves to a new paragraph
					document.execCommand("insertParagraph", false);
					// Sync state
					const event = new Event("input", { bubbles: true });
					editorRef.current?.dispatchEvent(event);
				}
				return;
			}

			// Case 2: Not in a list - check if current line has text with space
			if (!inList) {
				const range = sel.getRangeAt(0);
				const container =
					range.startContainer.nodeType === Node.TEXT_NODE
						? range.startContainer.parentElement
						: (range.startContainer as HTMLElement);

				if (container) {
					// Get text content of current line/block
					const text = (container.textContent ?? "")
						.replace(/\u200B/g, "")
						.trim();

					// If text contains a space (multiple words), auto-create bullet list
					if (text.includes(" ")) {
						e.preventDefault();
						// Create bullet list from current line
						document.execCommand("insertUnorderedList", false);
						// Then create new list item below
						document.execCommand("insertParagraph", false);
						// Sync state
						const event = new Event("input", { bubbles: true });
						editorRef.current?.dispatchEvent(event);
					}
				}
			}
		},
		[],
	);

	const execCommand = useCallback((cmd: string) => {
		const editor = editorRef.current;
		if (!editor) return;
		// Only focus if not already focused — prevents resetting cursor/selection position
		if (document.activeElement !== editor) {
			editor.focus();
		}

		// For list commands, ensure the cursor sits inside a text node so the
		// browser can create the <li> properly.  When the cursor is on an empty
		// line (which browsers often represent as a bare <br> or empty <div>),
		// `insertUnorderedList` silently does nothing.  Inserting a zero-width
		// space gives the browser something to anchor the list to.
		if (cmd === "insertUnorderedList" || cmd === "insertOrderedList") {
			const sel = window.getSelection();
			if (sel && sel.rangeCount > 0) {
				const range = sel.getRangeAt(0);
				const node = range.startContainer;

				// Check if we're already inside a list - if so, just toggle
				let inList = false;
				let checkNode: Node | null = node;
				while (checkNode && checkNode !== editor) {
					if (checkNode.nodeType === Node.ELEMENT_NODE) {
						const tag = (checkNode as HTMLElement).tagName?.toLowerCase();
						if (tag === "ul" || tag === "ol") {
							inList = true;
							break;
						}
					}
					checkNode = checkNode.parentNode;
				}

				if (!inList) {
					// Get the containing element
					const container =
						node.nodeType === Node.TEXT_NODE
							? node.parentElement
							: (node as HTMLElement);

					// Check if the line is empty or only has whitespace/zero-width spaces
					const text = (container?.textContent ?? "").replace(/\u200B/g, "");
					if (
						text.trim() === "" ||
						text === "\n" ||
						container?.innerHTML === "<br>"
					) {
						// Clear any existing content and insert a text node with zero-width space
						if (container) {
							container.textContent = "\u200B";
							// Move cursor to end of the text node
							const newRange = document.createRange();
							const textNode = container.firstChild;
							if (textNode) {
								newRange.setStart(textNode, 1);
								newRange.collapse(true);
								sel.removeAllRanges();
								sel.addRange(newRange);
							}
						}
					}
				}
			}
		}

		document.execCommand(cmd, false);
		// Trigger handleInput to sync state after the command
		const event = new Event("input", { bubbles: true });
		editor.dispatchEvent(event);
	}, []);

	return (
		<div>
			<div className="flex items-center gap-0.5 mb-1.5 pb-1.5 border-b border-gray-200">
				<button
					type="button"
					onMouseDown={(e) => e.preventDefault()}
					onClick={() => execCommand("bold")}
					className="p-1 rounded hover:bg-gray-200 text-gray-600 cursor-pointer"
					title="Bold"
				>
					<Bold className="h-3.5 w-3.5" />
				</button>
				<button
					type="button"
					onMouseDown={(e) => e.preventDefault()}
					onClick={() => execCommand("italic")}
					className="p-1 rounded hover:bg-gray-200 text-gray-600 cursor-pointer"
					title="Italic"
				>
					<Italic className="h-3.5 w-3.5" />
				</button>
				<button
					type="button"
					onMouseDown={(e) => e.preventDefault()}
					onClick={() => execCommand("underline")}
					className="p-1 rounded hover:bg-gray-200 text-gray-600 cursor-pointer"
					title="Underline"
				>
					<Underline className="h-3.5 w-3.5" />
				</button>
				<div className="h-4 w-px bg-gray-200 mx-0.5" />
				<button
					type="button"
					onMouseDown={(e) => e.preventDefault()}
					onClick={() => execCommand("insertUnorderedList")}
					className="p-1 rounded hover:bg-gray-200 text-gray-600 cursor-pointer"
					title="Bullet List"
				>
					<List className="h-3.5 w-3.5" />
				</button>
			</div>
			<div
				ref={editorRef}
				contentEditable
				suppressContentEditableWarning
				onInput={handleInput}
				onKeyDown={handleKeyDown}
				data-placeholder={placeholder}
				role="textbox"
				aria-multiline="true"
				style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
				className="min-h-15 max-h-30 overflow-y-auto text-sm outline-none bg-white rounded border border-gray-200 px-2.5 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1 [&_li]:pl-1 whitespace-pre-wrap"
			/>
			<div className="flex items-center justify-between mt-1.5">
				<span
					className={`text-[10px] ${textLength > maxLength ? "text-red-500 font-medium" : "text-gray-400"}`}
				>
					{textLength}/{maxLength}
				</span>
			</div>
		</div>
	);
}
