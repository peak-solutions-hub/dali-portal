import {
	formatDate,
	getClassificationLabel,
	getDocumentFilename,
	getDocumentNumber,
	getDocumentTitle,
	getDocumentTypeLabel,
	isValidPdfUrl,
	type LegislativeDocumentWithDetails,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import {
	BRAND_BUTTON_CLASS,
	BRAND_LINK_HOVER_CLASS,
	BRAND_TEXT_CLASS,
	DOCUMENT_CARD_BORDER_CLASS,
	getDocumentTypeBadgeClass,
} from "@repo/ui/lib/legislative-document-ui";
import { Calendar, FileText } from "@repo/ui/lib/lucide-react";
import Link from "next/link";
import { DocumentDownloadButton } from "./document-download-button";

interface DocumentCardProps {
	document: LegislativeDocumentWithDetails;
}

export function DocumentCard({ document }: DocumentCardProps) {
	const documentNumber = getDocumentNumber(document);
	const documentType = getDocumentTypeLabel(document.type);
	const documentTitle = getDocumentTitle(document);
	const formattedDate = formatDate(document.dateEnacted);
	const year = document.dateEnacted
		? new Date(document.dateEnacted).getFullYear()
		: "";
	const classification = document.displayClassification
		? getClassificationLabel(document.displayClassification)
		: document.document?.classification
			? getClassificationLabel(document.document.classification)
			: "N/A";

	const hasPdfFile = Boolean(document.pdfUrl && isValidPdfUrl(document.pdfUrl));
	const downloadFilename = getDocumentFilename(document);
	const readMoreLabel = `View ${documentType} ${documentNumber}`;
	const badgeClass = getDocumentTypeBadgeClass(document.type);

	return (
		<Card
			className={`overflow-hidden hover:shadow-md focus-within:shadow-md transition-all ${DOCUMENT_CARD_BORDER_CLASS}`}
		>
			<article className="px-5" aria-labelledby={`doc-title-${document.id}`}>
				<div className="flex items-start justify-between gap-4">
					{/* Left Content */}
					<div className="flex-1">
						{/* Type Badge and Number */}
						<div className="flex items-center gap-3 mb-2 flex-wrap">
							<span
								className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium ${badgeClass}`}
							>
								<FileText className="w-3 h-3" aria-hidden="true" />
								<span>{documentType}</span>
							</span>
							<span className={`text-sm ${BRAND_TEXT_CLASS} font-semibold`}>
								{documentNumber}
							</span>
						</div>

						{/* Title */}
						<h3
							id={`doc-title-${document.id}`}
							className="text-lg font-semibold mb-2 text-gray-900"
						>
							<Link
								href={`/legislative-documents/${document.id}`}
								className={`${BRAND_LINK_HOVER_CLASS} transition-colors rounded`}
								aria-label={`View details for ${documentTitle}`}
							>
								{documentTitle}
							</Link>
						</h3>

						{/* Year */}
						{year && (
							<div className="mb-2">
								<span className="inline-flex items-center gap-1 text-sm text-gray-500">
									<Calendar className="w-3 h-3" aria-hidden="true" />
									<time dateTime={String(year)}>{year}</time>
								</span>
							</div>
						)}

						{/* Metadata */}
						<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
							{document.authorNames && document.authorNames.length > 0 && (
								<span>
									Author:{" "}
									<span className="font-medium">
										{document.authorNames.join(", ")}
									</span>
								</span>
							)}
							{document.sponsorNames && document.sponsorNames.length > 0 && (
								<span>
									Sponsor:{" "}
									<span className="font-medium">
										{document.sponsorNames.join(", ")}
									</span>
								</span>
							)}
							{document.dateEnacted && (
								<span>
									Date Passed:{" "}
									<span className="font-medium">{formattedDate}</span>
								</span>
							)}
						</div>

						{/* Classification */}
						{classification && classification !== "N/A" && (
							<div className="mt-2 text-sm text-gray-500">
								<span className="font-medium">Classification:</span>{" "}
								{classification}
							</div>
						)}
					</div>

					{/* Right Action */}
					<div className="flex flex-col gap-2 shrink-0">
						<Link href={`/legislative-documents/${document.id}`}>
							<Button
								aria-label={readMoreLabel}
								className={`${BRAND_BUTTON_CLASS} w-full`}
							>
								View More
							</Button>
						</Link>
						{hasPdfFile ? (
							<DocumentDownloadButton
								pdfUrl={document.pdfUrl}
								filename={downloadFilename}
								ariaLabel={`Download PDF for ${documentNumber}`}
							/>
						) : null}
					</div>
				</div>
			</article>
		</Card>
	);
}
