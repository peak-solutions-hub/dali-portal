import {
	formatDate,
	getClassificationLabel,
	getDocumentFilename,
	getDocumentNumber,
	getDocumentTitle,
	getDocumentTypeLabel,
	type LegislativeDocumentWithDetails,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Calendar, Download, FileText } from "@repo/ui/lib/lucide-react";
import Link from "next/link";

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

	const hasPdfFile = Boolean(document.pdfUrl);

	return (
		<Card className="overflow-hidden hover:shadow-md transition-all border-l-4 border-l-[#a60202]">
			<div className="px-5">
				<div className="flex items-start justify-between gap-4">
					{/* Left Content */}
					<div className="flex-1">
						{/* Type Badge and Number */}
						<div className="flex items-center gap-3 mb-2 flex-wrap">
							<span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-gray-100 text-gray-700 font-medium">
								<FileText className="w-3 h-3" />
								{documentType}
							</span>
							<span className="text-sm text-[#a60202] font-semibold">
								{documentNumber}
							</span>
							{year && (
								<span className="inline-flex items-center gap-1 text-xs text-gray-500">
									<Calendar className="w-3 h-3" />
									{year}
								</span>
							)}
						</div>

						{/* Title */}
						<h3 className="text-lg font-semibold mb-2 text-gray-900">
							<Link
								href={`/legislative-documents/${document.id}`}
								className="hover:text-[#a60202] transition-colors"
							>
								{documentTitle}
							</Link>
						</h3>

						{/* Metadata */}
						<div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
							{(document.authorNames || document.sponsorNames) && (
								<span>
									Author:{" "}
									<span className="font-medium">
										{document.authorNames?.join(", ") ||
											document.sponsorNames?.join(", ")}
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
							<Button className="bg-[#a60202] hover:bg-[#8a0101] w-full">
								Read More
							</Button>
						</Link>
						{hasPdfFile ? (
							<Link
								href={document.pdfUrl || ""}
								download={getDocumentFilename(document)}
							>
								<Button variant="outline" title="Download PDF">
									<Download className="w-4 h-4 mr-2" />
									Download
								</Button>
							</Link>
						) : null}
					</div>
				</div>
			</div>
		</Card>
	);
}
