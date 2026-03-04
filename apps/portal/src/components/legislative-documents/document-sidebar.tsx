import {
	getClassificationLabel,
	getDocumentTypeLabel,
	type LegislativeDocumentWithDetails,
} from "@repo/shared";
import { Card } from "@repo/ui/components/card";
import { FileText, User } from "@repo/ui/lib/lucide-react";

interface DocumentSidebarProps {
	document: LegislativeDocumentWithDetails;
}

export function DocumentSidebar({ document }: DocumentSidebarProps) {
	const documentType = getDocumentTypeLabel(document.type);
	const classification = document.displayClassification
		? getClassificationLabel(document.displayClassification)
		: document.document?.classification
			? getClassificationLabel(document.document.classification)
			: null;

	const authorsAndSponsors = [
		...(document.authorNames || []),
		...(document.sponsorNames || []),
	];
	const uniqueAuthorsSponsors = Array.from(new Set(authorsAndSponsors));

	return (
		<Card className="overflow-hidden border py-0 border-gray-200 shadow-sm">
			<div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex items-center gap-2">
				<FileText className="w-4 h-4 text-gray-500" />
				<h3 className="font-semibold text-gray-800 text-sm">
					Document Details
				</h3>
			</div>
			<div className="p-5 space-y-6 bg-white">
				<div>
					<h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
						Document Type
					</h4>
					<div className="flex items-start gap-3">
						<div className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg shrink-0">
							<FileText className="w-4 h-4 text-gray-600" />
						</div>
						<div className="flex flex-col justify-center py-1">
							<p className="text-sm font-semibold text-gray-900">
								{documentType}
							</p>
						</div>
					</div>
				</div>

				{uniqueAuthorsSponsors.length > 0 && (
					<div className="pt-5 border-t border-gray-100">
						<h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
							Author / Sponsor
						</h4>
						<div className="flex items-start text-sm text-gray-800 gap-3">
							<div className="shrink-0 mt-0.5">
								<User className="w-4 h-4 text-gray-400" />
							</div>
							<div className="font-medium leading-relaxed">
								{uniqueAuthorsSponsors.join(", ")}
							</div>
						</div>
					</div>
				)}

				{classification && classification !== "N/A" && (
					<div className="pt-5 border-t border-gray-100">
						<h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
							Classification
						</h4>
						<p className="text-sm font-semibold text-[#a60202]">
							{classification}
						</p>
					</div>
				)}
			</div>
		</Card>
	);
}
