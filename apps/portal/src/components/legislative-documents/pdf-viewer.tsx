import { Button } from "@repo/ui/components/button";
import { Download } from "@repo/ui/lib/lucide-react";

interface PDFViewerProps {
	documentId: string;
	pdfUrl: string;
	documentTitle: string;
}

export function PDFViewer({
	documentId,
	pdfUrl,
	documentTitle,
}: PDFViewerProps) {
	return (
		<div className="mb-4 sm:mb-6">
			{pdfUrl ? (
				<>
					<iframe
						src={pdfUrl}
						className="w-full h-125 sm:h-150 md:h-200 rounded-lg border mb-4"
						title="Document PDF Preview"
					/>
					<a
						href={pdfUrl}
						download
						target="_blank"
						rel="noopener noreferrer"
						className="block sm:inline-block"
					>
						<Button className="w-full sm:w-auto bg-[#a60202] hover:bg-[#8a0101] text-white px-8 py-6">
							<Download className="w-5 h-5 mr-2" />
							Download PDF
						</Button>
					</a>
				</>
			) : (
				<div className="bg-gray-100 rounded-lg p-8 sm:p-12 mb-4 sm:mb-6 flex flex-col items-center justify-center min-h-75 sm:min-h-100">
					<p className="text-gray-600 mb-4 text-sm sm:text-base">
						PDF Document Preview
					</p>
					<p className="text-xs sm:text-sm text-gray-500">
						PDF not available for public viewing
					</p>
				</div>
			)}
		</div>
	);
}
