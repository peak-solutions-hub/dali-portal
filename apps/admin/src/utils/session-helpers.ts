/**
 * quill-html-normalizer.ts
 *
 * Client-safe Quill HTML normalizer + DOMPurify sanitizer.
 * Safe to import in "use client" files — no Node.js dependencies.
 *
 * Two-step pipeline:
 *   1. DOMPurify  — strips XSS vectors (event handlers, javascript: URLs, etc.)
 *   2. normalize  — fixes Quill-specific quirks for correct display
 *
 * Place at: src/utils/quill-html-normalizer.ts
 */

import DOMPurify from "dompurify";

// ─── DOMPurify config ────────────────────────────────────────────────────────
//
// Allow the full set of tags and attributes that Quill snow produces.
// Everything not in these lists is stripped by DOMPurify.
//
const ALLOWED_TAGS = [
	// Block
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
	// List
	"ul",
	"ol",
	"li",
	// Inline
	"span",
	"strong",
	"em",
	"u",
	"s",
	"sub",
	"sup",
	"br",
	// Link (Quill can produce these)
	"a",
];

const ALLOWED_ATTR = [
	// Quill class attributes (ql-indent-*, ql-align-*, data-list, etc.)
	"class",
	// Inline style — restricted to safe properties below via FORCE_BODY + hook
	"style",
	// Links
	"href",
	"target",
	"rel",
	// List type
	"type",
];

// CSS properties that are safe to allow in style attributes.
// Background-color is the only style Quill applies to spans (highlight).
// Text-align is applied by sanitizeQuillHtml() when converting ql-align-*.
const SAFE_STYLE_PROPS = new Set(["background-color", "color", "text-align"]);

/**
 * DOMPurify hook: strips any style property that isn't in SAFE_STYLE_PROPS.
 * Runs after DOMPurify has already removed event handlers and JS URLs.
 */
function installStyleHook() {
	// Only install once
	if (
		(DOMPurify as unknown as { _quillHookInstalled?: boolean })
			._quillHookInstalled
	)
		return;
	(
		DOMPurify as unknown as { _quillHookInstalled?: boolean }
	)._quillHookInstalled = true;

	DOMPurify.addHook("afterSanitizeAttributes", (node) => {
		if (!(node instanceof HTMLElement)) return;
		const style = node.getAttribute("style");
		if (!style) return;

		// Keep only safe CSS properties
		const kept = style
			.split(";")
			.map((s) => s.trim())
			.filter((s) => {
				if (!s) return false;
				const prop = s.split(":")[0]?.trim().toLowerCase() ?? "";
				return SAFE_STYLE_PROPS.has(prop);
			})
			.join("; ");

		if (kept) {
			node.setAttribute("style", kept);
		} else {
			node.removeAttribute("style");
		}
	});
}

// ─── Quill normalization helpers ─────────────────────────────────────────────

const ALIGN_MAP: Record<string, string> = {
	"ql-align-justify": "justify",
	"ql-align-center": "center",
	"ql-align-right": "right",
	"ql-align-left": "left",
};

/**
 * Converts ql-align-* class names to inline style="text-align:..." so
 * alignment renders without loading quill.snow.css. Other classes are kept.
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
 * Removes the outer <li> that Quill sometimes wraps around an inner <ul>/<ol>
 * (copy-paste artefact), which causes double/triple bullets.
 * Leaves ql-indent-* intact — CSS handles indentation via those classes.
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

	// Remove orphaned closing tags left by the unwrapping above
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

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Sanitizes and normalizes Quill HTML for safe display via html-react-parser.
 *
 * Pipeline:
 *   1. DOMPurify strips all XSS vectors (event handlers, javascript: URLs,
 *      dangerous tags, unsafe style properties).
 *   2. &nbsp; → regular spaces (prevents word-wrap gaps).
 *   3. ql-align-* → inline text-align style (alignment without quill.snow.css).
 *   4. Double/triple bullet fix (copy-paste nested list artefact).
 *
 * Safe to use with html-react-parser:
 *   import parse from "html-react-parser";
 *   <div className="summary-display">{parse(sanitizeQuillHtml(html))}</div>
 */
export function sanitizeQuillHtml(html: string | null | undefined): string {
	if (!html) return "";

	// DOMPurify only runs in the browser (it needs the DOM).
	// On the server (SSR) we skip it — the server-side Cheerio sanitizer
	// is the authoritative XSS gate before data is ever stored.
	if (typeof window !== "undefined") {
		installStyleHook();
		html = DOMPurify.sanitize(html, {
			ALLOWED_TAGS,
			ALLOWED_ATTR,
			// Force wrapping in <body> so DOMPurify doesn't add <html>/<head>
			FORCE_BODY: true,
			// Strip any remaining javascript: URLs even in allowed attributes
			ALLOW_DATA_ATTR: false,
		});
	}

	// &nbsp; → regular space (word-wrap fix)
	// Do NOT collapse multiple spaces — intentional spacing must be preserved
	let result = html.replace(/&nbsp;/gi, " ").replace(/\u00a0/g, " ");

	// ql-align-* → inline text-align style
	result = applyAlignmentAsStyle(result);

	// Fix double/triple bullets from physically nested lists
	result = fixDoubleBullets(result);

	// Remove class attributes that became empty after alignment conversion
	result = result.replace(/\s*class="\s*"/g, "");

	return result;
}

/**
 * Formats a "YYYY-MM-DD" date string as "January 15, 2024" (local, timezone-safe).
 * Extracted from agenda-item-card.tsx and minutes-picker.tsx where it was duplicated.
 */
export function formatMinutesDate(dateStr: string): string {
	const [year, month, day] = dateStr.split("-");
	const d = new Date(Number(year), Number(month) - 1, Number(day));
	return d.toLocaleDateString("en-US", {
		month: "long",
		day: "2-digit",
		year: "numeric",
	});
}
