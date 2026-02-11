"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

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
	const [textLength, setTextLength] = useState(0);

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
		],
		[],
	);

	const handleChange = useCallback(
		(content: string) => {
			// Quill produces <p><br></p> for empty content
			const isEmpty =
				!content ||
				content === "<p><br></p>" ||
				content === "<p></p>" ||
				content.replace(/<[^>]*>/g, "").trim() === "";

			const plainText = content.replace(/<[^>]*>/g, "");
			setTextLength(plainText.length);

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
			`}</style>
		</div>
	);
}
