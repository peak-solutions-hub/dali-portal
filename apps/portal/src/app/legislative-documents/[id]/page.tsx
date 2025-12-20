import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { ChevronLeft } from "@repo/ui/lib/lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentHeader } from "@/components/legislative-documents/document-header";
import { PDFViewer } from "@/components/legislative-documents/pdf-viewer";
import { fetchLegislativeDocument } from "@/lib/legislative-documents/data";

interface PageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function DocumentDetailPage({ params }: PageProps) {
	const { id } = await params;
	const document = await fetchLegislativeDocument(id);

	if (!document) {
		notFound();
	}

	const documentTitle =
		document.displayTitle || document.document?.title || "Untitled Document";
	const pdfUrl = document.pdfUrl || "/moock-documents/ALORA.pdf";

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Back Button */}
			<div className="bg-white border-b border-gray-200">
				<div className="container mx-auto px-4 py-4">
					<Link href="/legislative-documents">
						<Button
							variant="outline"
							size="sm"
							className="flex items-center gap-2"
						>
							<ChevronLeft className="h-4 w-4" />
							Back to Documents
						</Button>
					</Link>
				</div>
			</div>

			{/* Main Content */}
			<div className="container mx-auto px-4 py-8">
				<Card className="p-4 sm:p-6 md:p-8">
					<div className="space-y-6">
						{/* Document Header with Metadata */}
						<DocumentHeader document={document} />

						{/* PDF Viewer */}
						<PDFViewer
							documentId={id}
							pdfUrl={pdfUrl}
							documentTitle={documentTitle}
						/>
					</div>
				</Card>
			</div>
		</div>
	);
}
