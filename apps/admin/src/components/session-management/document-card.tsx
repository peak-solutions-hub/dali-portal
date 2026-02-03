import type { SessionManagementDocument as Document } from "@repo/shared";
import { getDocumentTypeBadgeClass } from "@repo/ui/lib/session-ui";
import { FileText, GripVertical } from "lucide-react";

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
			className="group overflow-hidden hover:shadow-lg active:shadow-xl transition-all duration-200 border border-gray-200 rounded-lg border-l-4 border-l-[#a60202] bg-white cursor-grab active:cursor-grabbing hover:border-gray-300"
		>
			<article
				className="px-4 py-3"
				aria-labelledby={`doc-title-${document.id}`}
			>
				<div className="flex items-start gap-2">
					{/* Drag Handle */}
					<div className="shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors pt-1">
						<GripVertical className="w-4 h-4" aria-hidden="true" />
					</div>

					{/* Content */}
					<div className="flex-1 min-w-0">
						{/* Type Badge and Number */}
						<div className="flex items-center gap-2 mb-1.5 flex-wrap">
							<span
								className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium ${getDocumentTypeBadgeClass(document.type)}`}
							>
								<FileText className="w-3 h-3" aria-hidden="true" />
								<span>{document.type}</span>
							</span>
							<span className="text-sm text-[#a60202] font-semibold">
								{document.number}
							</span>
						</div>

						{/* Title */}
						<h3
							id={`doc-title-${document.id}`}
							className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-[#a60202] transition-colors"
						>
							{document.title}
						</h3>
					</div>
				</div>
			</article>
		</div>
	);
}
