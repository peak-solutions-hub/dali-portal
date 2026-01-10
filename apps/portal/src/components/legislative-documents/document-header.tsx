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
		<header className="mb-6 sm:mb-8">
			{/* Document Number */}
			<h1
				className="font-['Playfair_Display'] text-xl sm:text-2xl md:text-3xl text-[#a60202] mb-3 sm:mb-4"
				aria-label={`Document Number: ${documentNumber}`}
			>
				{documentNumber}
			</h1>
			{/* Title */}
			<h2 className="text-base sm:text-lg md:text-xl mb-4 sm:mb-6">
				{documentTitle}
			</h2>

			{/* Metadata Grid */}
			<dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-gray-50 p-4 sm:p-6 rounded-lg">
				{/* Date Passed/Approved */}
				<div>
					<dt className="text-sm text-gray-600">Date Passed/Approved</dt>
					<dd className="font-medium">
						<time dateTime={document.dateEnacted?.toISOString()}>
							{formattedDate}
						</time>
					</dd>
				</div>
				{/* Author(s) */}
				{document.authorNames && document.authorNames.length > 0 && (
					<div>
						<dt className="text-sm text-gray-600">Author(s)</dt>
						<dd className="font-medium">{document.authorNames.join(", ")}</dd>
					</div>
				)}
				{/* Sponsor(s) */}
				{document.sponsorNames && document.sponsorNames.length > 0 && (
					<div>
						<dt className="text-sm text-gray-600">Sponsor(s)</dt>
						<dd className="font-medium">{document.sponsorNames.join(", ")}</dd>
					</div>
				)}
				{/* Classification */}
				{classification && classification !== "N/A" && (
					<div>
						<dt className="text-sm text-gray-600">Classification</dt>
						<dd className="font-medium">{classification}</dd>
					</div>
				)}
				{/* Document Type */}
				<div>
					<dt className="text-sm text-gray-600">Document Type</dt>
					<dd className="font-medium">{documentType}</dd>
				</div>
			</dl>
		</header>
	);
}
