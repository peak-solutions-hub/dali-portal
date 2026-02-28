import parse from "html-react-parser";
import { sanitizeQuillHtml } from "@/utils/session-helpers";

interface SessionMinutesReadOnlyProps {
	contentText: string;
}

export function SessionMinutesReadOnly({
	contentText,
}: SessionMinutesReadOnlyProps) {
	return (
		<div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
			{parse(sanitizeQuillHtml(contentText) ?? "")}
		</div>
	);
}
