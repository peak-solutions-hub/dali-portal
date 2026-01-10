"use client";

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
import { createSupabaseBrowserClient, getDocumentPdfUrl } from "@repo/ui/lib";
import {
	Calendar,
	Download,
	FileText,
	Loader2,
} from "@repo/ui/lib/lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { downloadFile } from "@/utils/download-utils";

interface DocumentCardProps {
	document: LegislativeDocumentWithDetails;
}

export function DocumentCard({ document }: DocumentCardProps) {
	const [isDownloading, setIsDownloading] = useState(false);
	const [pdfUrl, setPdfUrl] = useState<string | undefined>();

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

	const hasPdfFile = Boolean(document.storagePath && document.storageBucket);
	const downloadFilename = getDocumentFilename(document);

	// Generate signed URL when component mounts
	useEffect(() => {
		if (document.storagePath && document.storageBucket) {
			const supabase = createSupabaseBrowserClient();
			getDocumentPdfUrl(supabase, document).then(setPdfUrl);
		}
	}, [document]);

	const handleDownload = useCallback(async () => {
		if (!pdfUrl || !document.storagePath || !document.storageBucket) return;

		setIsDownloading(true);
		try {
			const supabase = createSupabaseBrowserClient();
			await downloadFile(
				supabase,
				document.storageBucket,
				document.storagePath,
				downloadFilename,
			);
		} catch {
			// Error already logged and handled by downloadFile
		} finally {
			setIsDownloading(false);
		}
	}, [pdfUrl, downloadFilename, document]);

	return (
		<Card className="overflow-hidden hover:shadow-md focus-within:shadow-md transition-all border-l-4 border-l-[#a60202]">
			<article className="px-5" aria-labelledby={`doc-title-${document.id}`}>
				<div className="flex items-start justify-between gap-4">
					{/* Left Content */}
					<div className="flex-1">
						{/* Type Badge and Number */}
						<div className="flex items-center gap-3 mb-2 flex-wrap">
							{document.type === "ordinance" && (
								<span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium bg-blue-100 text-blue-800">
									<FileText className="w-3 h-3" aria-hidden="true" />
									<span>{documentType}</span>
								</span>
							)}
							{document.type === "resolution" && (
								<span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium bg-green-100 text-green-800">
									<FileText className="w-3 h-3" aria-hidden="true" />
									<span>{documentType}</span>
								</span>
							)}
							{document.type !== "ordinance" &&
								document.type !== "resolution" && (
									<span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium bg-gray-100 text-gray-800">
										<FileText className="w-3 h-3" aria-hidden="true" />
										<span>{documentType}</span>
									</span>
								)}
							<span className="text-sm text-[#a60202] font-semibold">
								{documentNumber}
							</span>
							{year && (
								<span className="inline-flex items-center gap-1 text-xs text-gray-500">
									<Calendar className="w-3 h-3" aria-hidden="true" />
									<time dateTime={String(year)}>{year}</time>
								</span>
							)}
						</div>

						{/* Title */}
						<h3
							id={`doc-title-${document.id}`}
							className="text-lg font-semibold mb-2 text-gray-900"
						>
							<Link
								href={`/legislative-documents/${document.id}`}
								className="hover:text-[#a60202] focus-visible:text-[#a60202] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a60202] transition-colors rounded"
								aria-label={`View details for ${documentTitle}`}
							>
								{documentTitle}
							</Link>
						</h3>

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
							<Button className="bg-[#a60202] hover:bg-[#8a0101] w-full">
								Read More
							</Button>
						</Link>
						{hasPdfFile ? (
							<Button
								variant="outline"
								title="Download PDF"
								onClick={handleDownload}
								disabled={isDownloading}
								className="min-w-30"
								aria-label={
									isDownloading
										? "Downloading PDF..."
										: `Download PDF for ${documentNumber}`
								}
								aria-busy={isDownloading}
							>
								{isDownloading ? (
									<Loader2
										className="w-4 h-4 animate-spin"
										aria-hidden="true"
									/>
								) : (
									<>
										<Download className="w-4 h-4 mr-2" aria-hidden="true" />
										Download
									</>
								)}
							</Button>
						) : null}
					</div>
				</div>
			</article>
		</Card>
	);
}
