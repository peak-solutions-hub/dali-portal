"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "react-quill-new/dist/quill.snow.css";

// Register the list-style ClassAttributor inside the dynamic import factory so
// it is available before Quill renders. Must stay here — top-level module scope
// with a bare `import { Quill }` would run on the server and crash.
const ReactQuill = dynamic(
	async () => {
		const { default: RQ } = await import("react-quill-new");
		// react-quill-new re-exports the Quill constructor as a static property
		const Quill = (RQ as unknown as { Quill: typeof import("quill").default })
			.Quill;

		interface ParchmentModule {
			ClassAttributor: new (
				name: string,
				keyName: string,
				options: { scope: number; whitelist: string[] },
			) => Record<string, unknown>;
			Scope: { BLOCK: number };
		}
		const Parchment = Quill.import("parchment") as unknown as ParchmentModule;

		if (Parchment?.ClassAttributor) {
			const ListStyleClass = new Parchment.ClassAttributor(
				"list-style",
				"ql-list-style",
				{
					scope: Parchment.Scope.BLOCK,
					whitelist: [
						"decimal",
						"lower-alpha",
						"lower-roman",
						"upper-alpha",
						"upper-roman",
					],
				},
			);
			Quill.register(
				{
					"attributors/class/list-style": ListStyleClass,
					"formats/list-style": ListStyleClass,
				},
				true,
			);
		}

		// Monkey-patch Clipboard.prototype.convertHTML to preserve non-breaking
		// spaces (\u00a0 / &nbsp;) through Quill's matchText normalization.
		//
		// Problem: Quill 2.x calls `matchText` on every text node during
		// clipboard.convert.  matchText always runs:
		//   text.replace(/ {2,}/g, ' ')   – collapses consecutive spaces
		//   text.replaceAll('\u00a0', ' ') – strips ALL non-breaking spaces
		// Since convertHTML uses DOMParser (detached DOM), CSS-based workarounds
		// (pre-wrap) don't help – isPre() only checks for <pre> tag ancestors.
		//
		// Fix: before DOMParser runs, swap every \u00a0 / &nbsp; for a Private
		// Use Area placeholder (\ue000) that matchText treats as a regular
		// character and leaves alone.  After traverse() produces the Delta we
		// restore the placeholder back to \u00a0.
		const ClipboardModule = Quill.import("modules/clipboard") as {
			prototype: {
				convertHTML: (html: string) => { ops: Array<{ insert: unknown }> };
			};
		} | null;

		if (ClipboardModule?.prototype?.convertHTML) {
			const PLACEHOLDER = "\ue000";
			const originalConvertHTML = ClipboardModule.prototype.convertHTML;

			ClipboardModule.prototype.convertHTML = function (html: string) {
				const processed = html
					.replace(/&nbsp;/gi, PLACEHOLDER)
					.replace(/\u00a0/g, PLACEHOLDER);

				const delta = originalConvertHTML.call(this, processed);

				if (delta?.ops) {
					for (const op of delta.ops) {
						if (typeof op.insert === "string") {
							op.insert = (op.insert as string).replaceAll(
								PLACEHOLDER,
								"\u00a0",
							);
						}
					}
				}
				return delta;
			};
		}

		return RQ;
	},
	{ ssr: false },
);

interface SessionRichTextEditorProps {
	value: string;
	onChange: (html: string) => void;
	maxLength?: number;
	placeholder?: string;
}

/**
 * Strip HTML tags and decode common HTML entities to get accurate plain-text
 * character count. Quill encodes spaces as &nbsp; (6 chars) which inflates the
 * count if we just strip tags without decoding entities first.
 */
function getPlainTextLength(html: string): number {
	if (!html) return 0;
	return (
		html
			// Decode common HTML entities before stripping tags
			.replace(/&nbsp;/gi, " ")
			.replace(/&amp;/gi, "&")
			.replace(/&lt;/gi, "<")
			.replace(/&gt;/gi, ">")
			.replace(/&quot;/gi, '"')
			.replace(/&#39;/gi, "'")
			// Strip all remaining HTML tags
			.replace(/<[^>]*>/g, "").length
	);
}

/**
 * Clipboard matcher: restores ql-indent-* and ql-list-style-* class-based
 * formats as Quill delta attributes during HTML → Delta conversion.
 * Ensures indent and list-style survive the round-trip when reopening the editor.
 */
function matchQuillClasses(
	node: Node,
	delta: {
		ops: Array<{ insert: unknown; attributes?: Record<string, unknown> }>;
	},
) {
	if (!(node instanceof HTMLElement)) return delta;
	for (const cls of node.classList) {
		const indentVal = cls.match(/^ql-indent-(\d+)$/)?.[1];
		if (indentVal) {
			const level = Number.parseInt(indentVal, 10);
			for (const op of delta.ops) {
				if (typeof op.insert === "string" && op.insert.includes("\n")) {
					op.attributes = { ...op.attributes, indent: level };
				}
			}
		}
		const styleVal = cls.match(/^ql-list-style-(.+)$/)?.[1];
		if (styleVal) {
			for (const op of delta.ops) {
				if (typeof op.insert === "string" && op.insert.includes("\n")) {
					op.attributes = { ...op.attributes, "list-style": styleVal };
				}
			}
		}
	}
	return delta;
}

export function SessionRichTextEditor({
	value,
	onChange,
	maxLength = 1000,
	placeholder,
}: SessionRichTextEditorProps) {
	// Initialize count from the current value so it's correct on first render
	// (fixes the "shows 0 until you start typing" bug).
	const [textLength, setTextLength] = useState(() => getPlainTextLength(value));

	// Keep count in sync if the value prop changes externally (e.g. when editing
	// a different document's summary the draft is loaded into the editor).
	const prevValueRef = useRef(value);
	useEffect(() => {
		if (prevValueRef.current !== value) {
			prevValueRef.current = value;
			setTextLength(getPlainTextLength(value));
		}
	}, [value]);

	const modules = useMemo(
		() => ({
			toolbar: [
				["bold", "italic", "underline", { script: "super" }],
				[{ background: [] }],
				[{ align: [] }],
				[{ list: "bullet" }, { list: "ordered" }],
				// Ordered list style picker — pin the marker style for the selected items
				[
					{
						"list-style": [
							"decimal",
							"lower-alpha",
							"lower-roman",
							"upper-alpha",
							"upper-roman",
						],
					},
				],
				["clean"],
			],
			keyboard: {
				bindings: {
					// Tab on a plain paragraph applies indent (Quill's built-in binding
					// only handles Tab when inside a list, blockquote, or already-indented block)
					"tab-indent-para": {
						key: "Tab",
						shiftKey: false,
						format: { list: false, blockquote: false },
						handler(this: {
							quill: {
								format: (f: string, v: string, s: string) => void;
							};
						}) {
							this.quill.format("indent", "+1", "user");
							return false;
						},
					},
					"tab-outdent-para": {
						key: "Tab",
						shiftKey: true,
						format: { list: false, blockquote: false },
						handler(this: {
							quill: {
								format: (f: string, v: string, s: string) => void;
							};
						}) {
							this.quill.format("indent", "-1", "user");
							return false;
						},
					},
				},
			},
			clipboard: {
				matchers: [[1, matchQuillClasses]],
			},
		}),
		[],
	);

	const formats = useMemo(
		() => [
			"bold",
			"italic",
			"underline",
			"script",
			"background",
			"align",
			"list",
			"indent",
			"list-style",
		],
		[],
	);

	const handleChange = useCallback(
		(content: string) => {
			const isEmpty =
				!content || content === "<p><br></p>" || content === "<p></p>";

			setTextLength(getPlainTextLength(content));

			if (isEmpty) {
				onChange("");
				return;
			}

			// Preserve consecutive spaces that would collapse during HTML round-trips.
			// Quill's clipboard.convert → matchText normalises \u00a0 → regular space
			// in the Delta.  After setContents the DOM text nodes hold regular spaces;
			// root.innerHTML therefore returns regular spaces.  On the *next* reload
			// the browser's HTML parser collapses runs of regular spaces to one.
			//
			// Fix: convert every second consecutive space in text content to \u00a0
			// (serialised as &nbsp;).  The HTML parser keeps \u00a0, so the spaces
			// survive unlimited round-trips.
			const preserved = content.replace(/>([^<]+)/g, (_m, text: string) => {
				return `>${text.replace(/ {2}/g, " \u00a0")}`;
			});

			onChange(preserved);
		},
		[onChange],
	);

	return (
		<div className="rich-text-editor-wrapper">
			<ReactQuill
				theme="snow"
				value={value}
				onChange={handleChange}
				modules={modules}
				formats={formats}
				placeholder={placeholder}
				useSemanticHTML={false}
			/>
			<div className="flex items-center justify-between mt-1.5">
				<span
					className={`text-[10px] ${textLength > maxLength ? "text-red-500 font-medium" : "text-gray-400"}`}
				>
					{textLength}/{maxLength}
				</span>
			</div>
			<style jsx global>{`
				/* ── Container ─────────────────────────────────────────────────── */
				.rich-text-editor-wrapper .ql-container {
					min-height: 60px;
					max-height: 120px;
					overflow-y: auto;
					font-size: 0.75rem;
					font-family: inherit;
					border-bottom-left-radius: 0.375rem;
					border-bottom-right-radius: 0.375rem;
				}
				.rich-text-editor-wrapper .ql-toolbar {
					border-top-left-radius: 0.375rem;
					border-top-right-radius: 0.375rem;
					background: #f9fafb;
					padding: 4px;
				}
				.rich-text-editor-wrapper .ql-toolbar .ql-formats {
					margin-right: 8px;
				}
				.rich-text-editor-wrapper .ql-toolbar button {
					width: 24px;
					height: 24px;
					padding: 2px;
				}
				.rich-text-editor-wrapper .ql-editor {
					padding: 8px 9px;
					line-height: 1.42;
					word-break: normal;
					overflow-wrap: break-word;
					white-space: pre-wrap;
				}
				.rich-text-editor-wrapper .ql-editor.ql-blank::before {
					font-style: normal;
					color: #9ca3af;
					font-size: 0.795rem;
				}

				/* ── Non-list indent (plain paragraphs / divs) ─────────────────── */
				/* Explicitly declared so these win regardless of quill.snow.css load order */
				.rich-text-editor-wrapper .ql-editor .ql-indent-1:not(li) { padding-left: 3em; }
				.rich-text-editor-wrapper .ql-editor .ql-indent-2:not(li) { padding-left: 6em; }
				.rich-text-editor-wrapper .ql-editor .ql-indent-3:not(li) { padding-left: 9em; }
				.rich-text-editor-wrapper .ql-editor .ql-indent-4:not(li) { padding-left: 12em; }
				.rich-text-editor-wrapper .ql-editor .ql-indent-5:not(li) { padding-left: 15em; }
				.rich-text-editor-wrapper .ql-editor .ql-indent-6:not(li) { padding-left: 18em; }
				.rich-text-editor-wrapper .ql-editor .ql-indent-7:not(li) { padding-left: 21em; }
				.rich-text-editor-wrapper .ql-editor .ql-indent-8:not(li) { padding-left: 24em; }

				/* ── List container ────────────────────────────────────────────── */
				.rich-text-editor-wrapper .ql-editor ul,
				.rich-text-editor-wrapper .ql-editor ol {
					padding-left: 1.5em;
				}
				/* Sub-list indents — match summary display */
				.rich-text-editor-wrapper .ql-editor li.ql-indent-1 { padding-left: 2.5em; }
				.rich-text-editor-wrapper .ql-editor li.ql-indent-2 { padding-left: 5em; }
				.rich-text-editor-wrapper .ql-editor li.ql-indent-3 { padding-left: 7.5em; }
				.rich-text-editor-wrapper .ql-editor li.ql-indent-4 { padding-left: 10em; }
				.rich-text-editor-wrapper .ql-editor li.ql-indent-5 { padding-left: 12.5em; }
				.rich-text-editor-wrapper .ql-editor li.ql-indent-6 { padding-left: 15em; }
				.rich-text-editor-wrapper .ql-editor li.ql-indent-7 { padding-left: 17.5em; }
				.rich-text-editor-wrapper .ql-editor li.ql-indent-8 { padding-left: 20em; }

				/* ── Ordered list style picker toolbar dropdown ─────────────────── */
				.rich-text-editor-wrapper .ql-toolbar .ql-list-style {
					width: 34px;
				}
				/* Collapsed label */
				.rich-text-editor-wrapper .ql-toolbar .ql-list-style .ql-picker-label::before {
					content: '1.';
					font-size: 0.7rem;
					font-weight: 600;
					line-height: 22px;
				}
				.rich-text-editor-wrapper .ql-toolbar .ql-list-style .ql-picker-label[data-value='lower-alpha']::before { content: 'a.'; }
				.rich-text-editor-wrapper .ql-toolbar .ql-list-style .ql-picker-label[data-value='lower-roman']::before { content: 'i.'; }
				.rich-text-editor-wrapper .ql-toolbar .ql-list-style .ql-picker-label[data-value='upper-alpha']::before { content: 'A.'; }
				.rich-text-editor-wrapper .ql-toolbar .ql-list-style .ql-picker-label[data-value='upper-roman']::before { content: 'I.'; }
				/* Dropdown items */
				.rich-text-editor-wrapper .ql-toolbar .ql-list-style .ql-picker-item[data-value='decimal']::before   { content: '1.  (1, 2, 3)'; font-size: 0.72rem; }
				.rich-text-editor-wrapper .ql-toolbar .ql-list-style .ql-picker-item[data-value='lower-alpha']::before { content: 'a.  (a, b, c)'; font-size: 0.72rem; }
				.rich-text-editor-wrapper .ql-toolbar .ql-list-style .ql-picker-item[data-value='lower-roman']::before { content: 'i.  (i, ii, iii)'; font-size: 0.72rem; }
				.rich-text-editor-wrapper .ql-toolbar .ql-list-style .ql-picker-item[data-value='upper-alpha']::before { content: 'A.  (A, B, C)'; font-size: 0.72rem; }
				.rich-text-editor-wrapper .ql-toolbar .ql-list-style .ql-picker-item[data-value='upper-roman']::before { content: 'I.  (I, II, III)'; font-size: 0.72rem; }
				/* Widen dropdown panel to fit item labels */
				.rich-text-editor-wrapper .ql-toolbar .ql-list-style .ql-picker-options {
					width: 150px;
					left: -58px;
				}

				/* ── Ordered list — force decimal on ALL indent levels ─────────── */
				/* Prevents Quill's confusing 1.→a.→i.→1. cycling.                */
				/* The wrapper prefix gives enough specificity to beat quill.snow. */
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-indent-1 > .ql-ui:before { content: counter(list-1, decimal) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-indent-2 > .ql-ui:before { content: counter(list-2, decimal) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-indent-3 > .ql-ui:before { content: counter(list-3, decimal) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-indent-4 > .ql-ui:before { content: counter(list-4, decimal) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-indent-5 > .ql-ui:before { content: counter(list-5, decimal) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-indent-6 > .ql-ui:before { content: counter(list-6, decimal) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-indent-7 > .ql-ui:before { content: counter(list-7, decimal) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-indent-8 > .ql-ui:before { content: counter(list-8, decimal) '. '; }

				/* ── Explicit list-style overrides (via dropdown picker) ────────── */
				/* .rich-text-editor-wrapper prefix + extra .ql-list-style-* class  */
				/* gives higher specificity than the default decimal overrides.      */

				/* decimal (explicit) */
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-decimal > .ql-ui:before { content: counter(list-0, decimal) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-decimal.ql-indent-1 > .ql-ui:before { content: counter(list-1, decimal) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-decimal.ql-indent-2 > .ql-ui:before { content: counter(list-2, decimal) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-decimal.ql-indent-3 > .ql-ui:before { content: counter(list-3, decimal) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-decimal.ql-indent-4 > .ql-ui:before { content: counter(list-4, decimal) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-decimal.ql-indent-5 > .ql-ui:before { content: counter(list-5, decimal) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-decimal.ql-indent-6 > .ql-ui:before { content: counter(list-6, decimal) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-decimal.ql-indent-7 > .ql-ui:before { content: counter(list-7, decimal) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-decimal.ql-indent-8 > .ql-ui:before { content: counter(list-8, decimal) '. '; }

				/* lower-alpha */
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-alpha > .ql-ui:before { content: counter(list-0, lower-alpha) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-alpha.ql-indent-1 > .ql-ui:before { content: counter(list-1, lower-alpha) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-alpha.ql-indent-2 > .ql-ui:before { content: counter(list-2, lower-alpha) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-alpha.ql-indent-3 > .ql-ui:before { content: counter(list-3, lower-alpha) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-alpha.ql-indent-4 > .ql-ui:before { content: counter(list-4, lower-alpha) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-alpha.ql-indent-5 > .ql-ui:before { content: counter(list-5, lower-alpha) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-alpha.ql-indent-6 > .ql-ui:before { content: counter(list-6, lower-alpha) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-alpha.ql-indent-7 > .ql-ui:before { content: counter(list-7, lower-alpha) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-alpha.ql-indent-8 > .ql-ui:before { content: counter(list-8, lower-alpha) '. '; }

				/* lower-roman */
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-roman > .ql-ui:before { content: counter(list-0, lower-roman) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-roman.ql-indent-1 > .ql-ui:before { content: counter(list-1, lower-roman) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-roman.ql-indent-2 > .ql-ui:before { content: counter(list-2, lower-roman) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-roman.ql-indent-3 > .ql-ui:before { content: counter(list-3, lower-roman) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-roman.ql-indent-4 > .ql-ui:before { content: counter(list-4, lower-roman) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-roman.ql-indent-5 > .ql-ui:before { content: counter(list-5, lower-roman) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-roman.ql-indent-6 > .ql-ui:before { content: counter(list-6, lower-roman) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-roman.ql-indent-7 > .ql-ui:before { content: counter(list-7, lower-roman) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-lower-roman.ql-indent-8 > .ql-ui:before { content: counter(list-8, lower-roman) '. '; }

				/* upper-alpha */
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-alpha > .ql-ui:before { content: counter(list-0, upper-alpha) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-alpha.ql-indent-1 > .ql-ui:before { content: counter(list-1, upper-alpha) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-alpha.ql-indent-2 > .ql-ui:before { content: counter(list-2, upper-alpha) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-alpha.ql-indent-3 > .ql-ui:before { content: counter(list-3, upper-alpha) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-alpha.ql-indent-4 > .ql-ui:before { content: counter(list-4, upper-alpha) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-alpha.ql-indent-5 > .ql-ui:before { content: counter(list-5, upper-alpha) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-alpha.ql-indent-6 > .ql-ui:before { content: counter(list-6, upper-alpha) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-alpha.ql-indent-7 > .ql-ui:before { content: counter(list-7, upper-alpha) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-alpha.ql-indent-8 > .ql-ui:before { content: counter(list-8, upper-alpha) '. '; }

				/* upper-roman */
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-roman > .ql-ui:before { content: counter(list-0, upper-roman) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-roman.ql-indent-1 > .ql-ui:before { content: counter(list-1, upper-roman) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-roman.ql-indent-2 > .ql-ui:before { content: counter(list-2, upper-roman) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-roman.ql-indent-3 > .ql-ui:before { content: counter(list-3, upper-roman) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-roman.ql-indent-4 > .ql-ui:before { content: counter(list-4, upper-roman) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-roman.ql-indent-5 > .ql-ui:before { content: counter(list-5, upper-roman) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-roman.ql-indent-6 > .ql-ui:before { content: counter(list-6, upper-roman) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-roman.ql-indent-7 > .ql-ui:before { content: counter(list-7, upper-roman) '. '; }
				.rich-text-editor-wrapper .ql-editor li[data-list=ordered].ql-list-style-upper-roman.ql-indent-8 > .ql-ui:before { content: counter(list-8, upper-roman) '. '; }
			`}</style>
		</div>
	);
}
