import {
	formatDate,
	getClassificationLabel,
	getDocumentNumber,
	getDocumentTitle,
	getDocumentTypeLabel,
	type LegislativeDocumentWithDetails,
} from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import {
	BRAND_TEXT_CLASS,
	getDocumentTypeBadgeClass,
} from "@repo/ui/lib/legislative-document-ui";
import { Calendar } from "@repo/ui/lib/lucide-react";

interface DocumentHeaderProps {
	document: LegislativeDocumentWithDetails;
}

export function DocumentHeader({ document }: DocumentHeaderProps) {
	const documentNumber = getDocumentNumber(document);
	const documentType = getDocumentTypeLabel(document.type);
	const documentTitle = getDocumentTitle(document);
	const formattedDate = formatDate(document.dateEnacted);
	const classification = document.displayClassification
		? getClassificationLabel(document.displayClassification)
		: document.document?.classification
			? getClassificationLabel(document.document.classification)
			: "N/A";

	const typeBadgeClass = getDocumentTypeBadgeClass(document.type);

	return (
		<header>
			<div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
				<Badge
					variant="outline"
					className={`uppercase tracking-wider font-semibold ${typeBadgeClass}`}
				>
					{documentType}
				</Badge>
				{classification && classification !== "N/A" && (
					<Badge
						variant="outline"
						className="border-gray-200 bg-white text-gray-600 font-normal"
					>
						{classification}
					</Badge>
				)}
			</div>

			{/* Document Number */}
			{documentNumber && (
				<div
					className="text-sm font-semibold tracking-widest text-[#a1a1aa] uppercase mb-3"
					aria-label={`Document Number: ${documentNumber}`}
				>
					{documentNumber}
				</div>
			)}

			{/* Title */}
			<h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl md:text-[34px] text-[#0f172a] mb-4 leading-tight max-w-4xl">
				{documentTitle}
			</h1>

			{/* Date Enacted */}
			<div
				className={`flex items-center gap-2 text-md sm:text-base ${BRAND_TEXT_CLASS} font-medium mt-2`}
			>
				<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
				<span>Date Enacted: {formattedDate}</span>
			</div>
		</header>
	);
}
