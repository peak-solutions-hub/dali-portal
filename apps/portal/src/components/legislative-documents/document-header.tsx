import type { LegislativeDocumentWithDetails } from "types/legislative-documents.types";
import {
	formatDate,
	getDocumentNumber,
	getDocumentTitle,
	getDocumentType,
} from "@/lib/legislative-documents/utils";

interface DocumentHeaderProps {
	document: LegislativeDocumentWithDetails;
}

export function DocumentHeader({ document }: DocumentHeaderProps) {
	const documentNumber = getDocumentNumber(document);
	const documentType = getDocumentType(document);
	const documentTitle = getDocumentTitle(document);
	const formattedDate = formatDate(document.date_enacted);
	const classification =
		document.displayClassification ||
		document.document?.classification ||
		"N/A";

	return (
		<div className="mb-6 sm:mb-8">
			{/* Document Number */}
			<h1
				className="text-xl sm:text-2xl md:text-3xl text-[#a60202] mb-3 sm:mb-4"
				style={{ fontFamily: "Playfair Display" }}
			>
				{documentNumber}
			</h1>
			{/* Title */}
			<h2 className="text-base sm:text-lg md:text-xl mb-4 sm:mb-6">
				{documentTitle}
			</h2>

			{/* Metadata Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-gray-50 p-4 sm:p-6 rounded-lg">
				{/* Date Passed/Approved */}
				<div>
					<p className="text-sm text-gray-600">Date Passed/Approved</p>
					<p className="font-medium">{formattedDate}</p>
				</div>
				{/* Author(s) */}
				{(document.author_names || document.sponsor_names) && (
					<div>
						<p className="text-sm text-gray-600">Author(s)</p>
						<p className="font-medium">
							{document.author_names?.join(", ") ||
								document.sponsor_names?.join(", ")}
						</p>
					</div>
				)}
				{/* Classification */}
				{classification && classification !== "N/A" && (
					<div>
						<p className="text-sm text-gray-600">Classification</p>
						<p className="font-medium">{classification}</p>
					</div>
				)}
				{/* Document Type */}
				<div>
					<p className="text-sm text-gray-600">Document Type</p>
					<p className="font-medium">{documentType}</p>
				</div>
			</div>
		</div>
	);
}
