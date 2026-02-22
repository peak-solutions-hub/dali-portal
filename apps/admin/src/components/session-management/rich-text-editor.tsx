"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface RichTextEditorProps {
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

export function RichTextEditor({
	value,
	onChange,
	maxLength = 1000,
	placeholder,
}: RichTextEditorProps) {
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
				["clean"],
			],
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
		],
		[],
	);

	const handleChange = useCallback(
		(content: string) => {
			const isEmpty =
				!content || content === "<p><br></p>" || content === "<p></p>";

			setTextLength(getPlainTextLength(content));
			onChange(isEmpty ? "" : content);
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
			/>
			<div className="flex items-center justify-between mt-1.5">
				<span
					className={`text-[10px] ${textLength > maxLength ? "text-red-500 font-medium" : "text-gray-400"}`}
				>
					{textLength}/{maxLength}
				</span>
			</div>
			<style jsx global>{`
				.rich-text-editor-wrapper .ql-container {
					min-height: 60px;
					max-height: 120px;
					overflow-y: auto;
					font-size: 0.875rem;
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
					padding: 8px 10px;
					word-break: break-word;
					overflow-wrap: break-word;
				}
				.rich-text-editor-wrapper .ql-editor.ql-blank::before {
					font-style: normal;
					color: #9ca3af;
					font-size: 0.875rem;
				}
				.rich-text-editor-wrapper .ql-editor ul,
				.rich-text-editor-wrapper .ql-editor ol {
					padding-left: 1.25rem;
				}
				.rich-text-editor-wrapper .ql-editor li.ql-indent-1 {
					padding-left: 2.5rem;
				}
				.rich-text-editor-wrapper .ql-editor li.ql-indent-2 {
					padding-left: 3.75rem;
				}
			`}</style>
		</div>
	);
}
