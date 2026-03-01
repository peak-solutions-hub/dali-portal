import parse from "html-react-parser";
import { sanitizeQuillHtmlServer } from "@/utils/quill-html-utils.server";

/**
 * Renders sanitized Quill HTML for the public portal.
 * Block mode wraps in a `<div class="portal-content">`, inline in a `<span class="portal-inline">`.
 */
export function QuillContent({
	html,
	inline = false,
}: {
	html: string | null | undefined;
	inline?: boolean;
}) {
	if (!html) return null;
	const safe = sanitizeQuillHtmlServer(html);
	if (!safe) return null;
	if (inline) {
		return <span className="portal-inline">{parse(safe)}</span>;
	}
	return <div className="portal-content">{parse(safe)}</div>;
}
