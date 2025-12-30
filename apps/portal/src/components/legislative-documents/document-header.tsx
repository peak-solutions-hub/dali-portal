import {
	formatDate,
	getClassificationLabel,
	getDocumentNumber,
	getDocumentTitle,
	getDocumentTypeLabel,
	type LegislativeDocumentWithDetails,
} from "@repo/shared";

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

	return (
		<div className="mb-6 sm:mb-8">
			{/* Document Number */}
			<h1 className="font-['Playfair_Display'] text-xl sm:text-2xl md:text-3xl text-[#a60202] mb-3 sm:mb-4">
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
				{(document.authorNames || document.sponsorNames) && (
					<div>
						<p className="text-sm text-gray-600">Author(s)</p>
						<p className="font-medium">
							{document.authorNames?.join(", ") ||
								document.sponsorNames?.join(", ")}
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
