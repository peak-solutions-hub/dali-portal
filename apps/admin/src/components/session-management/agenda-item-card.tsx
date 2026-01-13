import { Button } from "@repo/ui/components/button";
import { ChevronDown, X } from "@repo/ui/lib/lucide-react";
import type { AgendaItem } from "@/types/session-management";

interface Document {
	id: string;
	key: string;
	title: string;
}

interface AgendaItemCardProps {
	item: AgendaItem;
	documents?: Document[];
	onAddDocument: (itemId: string) => void;
	onRemoveDocument?: (agendaItemId: string, documentId: string) => void;
}

export function AgendaItemCard({
	item,
	documents = [],
	onAddDocument,
	onRemoveDocument,
}: AgendaItemCardProps) {
	return (
		<div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 bg-white">
			<h4 className="text-base font-medium text-gray-900 leading-6">
				{item.title}
			</h4>

			{/* Attached Documents */}
			{documents.length > 0 && (
				<div className="flex flex-col gap-2">
					{documents.map((doc: Document) => (
						<div
							key={doc.id}
							className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200"
						>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-gray-900">{doc.key}</p>
								<p className="text-sm text-gray-600 truncate">{doc.title}</p>
							</div>
							{onRemoveDocument && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onRemoveDocument(item.id, doc.id)}
									className="ml-2 text-gray-600 hover:text-red-600 cursor-pointer"
								>
									Remove
								</Button>
							)}
						</div>
					))}
				</div>
			)}

			{/* Add Document Button */}
			<button
				type="button"
				onClick={() => onAddDocument(item.id)}
				className="flex h-9 w-full items-center justify-between rounded-md bg-[#f3f3f5] px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
			>
				<span>+ Add document</span>
				<ChevronDown className="h-4 w-4" />
			</button>
		</div>
	);
}
