/**
 * server-html-sanitizer.ts
 *
 * Server-side HTML sanitizer for rendering Quill content in Next.js
 * server components. Uses sanitize-html (Node.js safe, no DOM needed).
 *
 * Place at: src/utils/server-html-sanitizer.ts
 *
 * Install: pnpm add sanitize-html && pnpm add -D @types/sanitize-html
 *
 * DO NOT import this in "use client" files — use quill-html-normalizer.ts
 * (DOMPurify) for client components instead.
 */

import sanitizeHtml from "sanitize-html";

const ALIGN_MAP: Record<string, string> = {
	"ql-align-justify": "justify",
	"ql-align-center": "center",
	"ql-align-right": "right",
	"ql-align-left": "left",
};

/**
 * Converts ql-align-* class names to inline style="text-align:..."
 * so alignment renders without loading quill.snow.css.
 */
function applyAlignmentAsStyle(html: string): string {
	return html.replace(
		/(<[a-z][a-z0-9]*\b[^>]*?)class="([^"]*)"([^>]*>)/gi,
		(fullMatch, before, classValue, after) => {
			const classes = classValue.split(/\s+/).filter(Boolean);
			let alignStyle = "";
			const remaining: string[] = [];

			for (const cls of classes) {
				const val = ALIGN_MAP[cls];
				if (val && !alignStyle) {
					alignStyle = `text-align: ${val};`;
				} else {
					remaining.push(cls);
				}
			}

			if (!alignStyle) return fullMatch;

			const classAttr =
				remaining.length > 0 ? `class="${remaining.join(" ")}"` : "";

			if (/style="[^"]*"/i.test(before + after)) {
				return (before + classAttr + after).replace(
					/style="([^"]*)"/i,
					`style="$1 ${alignStyle}"`,
				);
			}
			return `${before}${classAttr} style="${alignStyle}"${after}`;
		},
	);
}

/**
 * Removes outer <li> that only wraps an inner <ul>/<ol> (copy-paste
 * double-bullet artefact). Leaves ql-indent-* intact for CSS.
 */
function fixDoubleBullets(html: string): string {
	let result = html;
	let prev: string;
	do {
		prev = result;
		result = result.replace(
			/<li[^>]*>\s*(<(?:ul|ol)[^>]*>[\s\S]*?<\/(?:ul|ol)>)\s*<\/li>/gi,
			"$1",
		);
	} while (result !== prev);

	for (const tag of ["ul", "ol"] as const) {
		const opens = (result.match(new RegExp(`<${tag}[^>]*>`, "gi")) ?? [])
			.length;
		let closes = (result.match(new RegExp(`<\\/${tag}>`, "gi")) ?? []).length;
		while (closes > opens) {
			result = result.replace(new RegExp(`<\\/${tag}>`), "");
			closes--;
		}
	}

	return result;
}

/**
 * Sanitizes and normalizes Quill HTML for safe server-side rendering.
 *
 * Pipeline:
 *   1. sanitize-html strips XSS (event handlers, javascript: URLs, bad tags)
 *   2. &nbsp; → regular space (word-wrap fix)
 *   3. ql-align-* → inline text-align style
 *   4. Double/triple bullet fix
 *
 * Use with html-react-parser in server components:
 *
 *   import parse from "html-react-parser";
 *   import { sanitizeQuillHtmlServer } from "@/utils/server-html-sanitizer";
 *
 *   <div className="summary-display">
 *     {parse(sanitizeQuillHtmlServer(item.contentText))}
 *   </div>
 */
export function sanitizeQuillHtmlServer(
	html: string | null | undefined,
): string {
	if (!html) return "";

	// Step 1: XSS sanitization via sanitize-html
	let result = sanitizeHtml(html, {
		// Tags Quill snow can produce
		allowedTags: [
			"p",
			"div",
			"blockquote",
			"pre",
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6",
			"ul",
			"ol",
			"li",
			"span",
			"strong",
			"em",
			"u",
			"s",
			"sub",
			"sup",
			"br",
			"a",
		],
		allowedAttributes: {
			// Allow class on all tags (ql-indent-*, ql-align-*, etc.)
			"*": ["class", "style"],
			// Links
			a: ["href", "target", "rel"],
			// Lists
			ol: ["type"],
		},
		allowedStyles: {
			"*": {
				// Only safe CSS properties
				"text-align": [/^(left|right|center|justify)$/],
				"background-color": [/^.+$/],
				color: [/^.+$/],
			},
		},
		// Strip javascript: and data: URLs from href
		allowedSchemes: ["http", "https", "mailto"],
		// Force links to be safe
		allowedSchemesByTag: {
			a: ["http", "https", "mailto"],
		},
	});

	// Step 2: &nbsp; → regular space (word-wrap fix)
	result = result.replace(/&nbsp;/gi, " ").replace(/\u00a0/g, " ");

	// Step 3: ql-align-* → inline text-align style
	result = applyAlignmentAsStyle(result);

	// Step 4: fix double/triple bullets from nested lists
	result = fixDoubleBullets(result);

	// Clean up empty class attributes
	result = result.replace(/\s*class="\s*"/g, "");

	return result;
}
