import type { SessionManagementDocument as Document } from "@repo/shared";
import { File } from "lucide-react";

interface DocumentCardProps {
	document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.effectAllowed = "copy";
		e.dataTransfer.setData("application/json", JSON.stringify(document));
	};

	return (
		<div
			draggable
			onDragStart={handleDragStart}
			className="flex flex-col gap-0 rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 cursor-move transition-all hover:shadow-md"
		>
			<div className="flex items-start gap-2">
				<File className="h-4 w-4 shrink-0 text-gray-600 mt-1" />
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium text-gray-900 leading-5">
						{document.number}
					</p>
					<p className="text-xs text-gray-600 leading-4 mt-1 line-clamp-2">
						{document.title}
					</p>
					<div className="mt-2">
						<span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-900">
							{document.type}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
