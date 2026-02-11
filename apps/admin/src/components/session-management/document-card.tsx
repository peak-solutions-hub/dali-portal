import type { SessionManagementDocument as Document } from "@repo/shared";
import {
	getClassificationLabel,
	getDocumentTypeBadgeClass,
} from "@repo/ui/lib/session-ui";
import {
	Calendar,
	ExternalLink,
	FileText,
	GripVertical,
	Tag,
	User,
	Users,
} from "lucide-react";

interface DocumentCardProps {
	document: Document;
	onViewDocument?: (documentId: string) => void;
}

/** Format ISO date to short readable */
function formatDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function DocumentCard({ document, onViewDocument }: DocumentCardProps) {
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
							className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-[#a60202] transition-colors"
						>
							{document.title}
						</h3>

						{/* Details row */}
						<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
							{/* Classification */}
							<span className="inline-flex items-center gap-1">
								<Tag className="w-3 h-3" aria-hidden="true" />
								{getClassificationLabel(document.classification)}
							</span>

							{/* Date received */}
							<span className="inline-flex items-center gap-1">
								<Calendar className="w-3 h-3" aria-hidden="true" />
								{formatDate(document.receivedAt)}
							</span>

							{/* Authors */}
							{document.authors.length > 0 && (
								<span className="inline-flex items-center gap-1">
									<User className="w-3 h-3" aria-hidden="true" />
									{document.authors.join(", ")}
								</span>
							)}

							{/* Sponsors */}
							{document.sponsors.length > 0 && (
								<span className="inline-flex items-center gap-1">
									<Users className="w-3 h-3" aria-hidden="true" />
									{document.sponsors.join(", ")}
								</span>
							)}
						</div>

						{/* View link */}
						<button
							type="button"
							className="inline-flex items-center gap-1 mt-1.5 text-xs text-[#a60202] hover:underline font-medium cursor-pointer"
							onClick={(e) => {
								e.stopPropagation();
								if (onViewDocument) {
									onViewDocument(document.id);
								}
							}}
							onMouseDown={(e) => e.stopPropagation()}
						>
							<ExternalLink className="w-3 h-3" />
							View Document
						</button>
					</div>
				</div>
			</article>
		</div>
	);
}
