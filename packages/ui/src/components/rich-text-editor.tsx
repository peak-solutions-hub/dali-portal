"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	Bold,
	Italic,
	List,
	ListOrdered,
	Quote,
	Redo,
	Undo,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";

interface RichTextEditorProps {
	content: string;
	onChange: (content: string) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	onKeyDown?: (event: KeyboardEvent) => void;
}

export function RichTextEditor({
	content,
	onChange,
	placeholder = "Start typing...",
	disabled = false,
	className,
	onKeyDown,
}: RichTextEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3],
				},
			}),
		],
		content,
		immediatelyRender: false,
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
		},
		editable: !disabled,
		onCreate: ({ editor }) => {
			// Set up keyboard handler
			if (onKeyDown) {
				editor.view.dom.addEventListener(
					"keydown",
					onKeyDown as unknown as EventListener,
				);
			}
		},
		onDestroy: () => {
			// Clean up keyboard handler is handled automatically when editor is destroyed
		},
	});

	// Update editor content when the content prop changes (e.g., when clearing after send)
	useEffect(() => {
		if (editor && content !== editor.getHTML()) {
			editor.commands.setContent(content);
		}
	}, [content, editor]);

	if (!editor) {
		return null;
	}

	return (
		<div
			className={cn(
				"border rounded-md bg-background transition-all",
				"focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
				disabled && "opacity-50 pointer-events-none cursor-not-allowed",
				className,
			)}
		>
			{/* Toolbar */}
			<div className="border-b px-3 py-2 flex items-center gap-1 bg-muted/30">
				`
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleBold().run()}
					disabled={!editor.can().chain().focus().toggleBold().run()}
					className={cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-accent")}
				>
					<Bold className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleItalic().run()}
					disabled={!editor.can().chain().focus().toggleItalic().run()}
					className={cn(
						"h-8 w-8 p-0",
						editor.isActive("italic") && "bg-accent",
					)}
				>
					<Italic className="h-4 w-4" />
				</Button>
				<div className="w-px h-4 bg-border mx-1" />
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					className={cn(
						"h-8 w-8 p-0",
						editor.isActive("bulletList") && "bg-accent",
					)}
				>
					<List className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					className={cn(
						"h-8 w-8 p-0",
						editor.isActive("orderedList") && "bg-accent",
					)}
				>
					<ListOrdered className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					className={cn(
						"h-8 w-8 p-0",
						editor.isActive("blockquote") && "bg-accent",
					)}
				>
					<Quote className="h-4 w-4" />
				</Button>
				<div className="w-px h-4 bg-border mx-1" />
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().chain().focus().undo().run()}
					className="h-8 w-8 p-0"
				>
					<Undo className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().chain().focus().redo().run()}
					className="h-8 w-8 p-0"
				>
					<Redo className="h-4 w-4" />
				</Button>
			</div>

			{/* Editor */}
			<div className="relative">
				<EditorContent
					editor={editor}
					className="prose prose-sm max-w-none p-3 min-h-[100px] focus:outline-none"
					style={
						{
							"--tw-prose-body": "hsl(var(--foreground))",
							"--tw-prose-headings": "hsl(var(--foreground))",
							"--tw-prose-links": "hsl(var(--primary))",
							"--tw-prose-bold": "hsl(var(--foreground))",
							"--tw-prose-quotes": "hsl(var(--muted-foreground))",
							"--tw-prose-code": "hsl(var(--foreground))",
						} as React.CSSProperties
					}
				/>
				{/* Placeholder */}
				{editor.isEmpty && (
					<div className="absolute top-3 left-3 text-muted-foreground pointer-events-none text-sm">
						{placeholder}
					</div>
				)}
			</div>
		</div>
	);
}
