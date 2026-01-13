import type { DocumentsPanelProps } from "@/types/session-management";
import { DocumentCard } from "./document-card";

export function DocumentsPanel({ documents }: DocumentsPanelProps) {
	return (
		<div className="flex h-full w-full flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6">
			<div className="flex flex-col gap-2">
				<h3 className="text-base font-semibold text-gray-900 leading-6">
					Ready for Agenda
				</h3>
				<p className="text-sm text-gray-600 leading-5">
					Approved documents awaiting calendaring
				</p>
			</div>

			<div className="flex-1 overflow-y-auto">
				<div className="flex flex-col gap-2">
					{documents.length > 0 ? (
						documents.map((doc) => <DocumentCard key={doc.id} document={doc} />)
					) : (
						<div className="flex flex-col items-center justify-center py-8 text-gray-500">
							<p className="text-sm">No documents available</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
