"use client";

import { SessionManagementDocument } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { FileText, Search } from "@repo/ui/lib/lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SessionDocumentCard } from "./session-document-card";

const DOCS_PAGE_SIZE = 20;

export type SessionManagementDocumentsPanelProps = {
	documents: SessionManagementDocument[];
};
interface SessionDocumentsPanelPropsExtended
	extends SessionManagementDocumentsPanelProps {
	onViewDocument?: (documentId: string) => void;
}

export function SessionDocumentsPanel({
	documents,
	onViewDocument,
}: SessionDocumentsPanelPropsExtended) {
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");

	const filteredDocuments = useMemo(() => {
		return documents.filter((doc) => {
			// Type filter
			if (typeFilter !== "all") {
				const typeLower = doc.type.toLowerCase();
				if (typeFilter === "ordinance" && !typeLower.includes("ordinance")) {
					return false;
				}
				if (typeFilter === "resolution" && !typeLower.includes("resolution")) {
					return false;
				}
				if (
					typeFilter === "committee_report" &&
					!typeLower.includes("committee")
				) {
					return false;
				}
				if (typeFilter === "others") {
					// Show all documents that are NOT ordinances, resolutions, or committee reports
					if (
						typeLower.includes("ordinance") ||
						typeLower.includes("resolution") ||
						typeLower.includes("committee")
					) {
						return false;
					}
				}
			}

			// Search filter
			if (searchQuery) {
				const searchLower = searchQuery.toLowerCase();
				if (
					!doc.title.toLowerCase().includes(searchLower) &&
					!doc.number.toLowerCase().includes(searchLower) &&
					!doc.classification.toLowerCase().includes(searchLower)
				) {
					return false;
				}
			}
			return true;
		});
	}, [documents, typeFilter, searchQuery]);

	// Pagination: reset when filters change
	const [displayCount, setDisplayCount] = useState(DOCS_PAGE_SIZE);
	useEffect(() => {
		setDisplayCount(DOCS_PAGE_SIZE);
	}, [typeFilter, searchQuery]);

	const visibleDocuments = useMemo(
		() => filteredDocuments.slice(0, displayCount),
		[filteredDocuments, displayCount],
	);
	const hasMore = displayCount < filteredDocuments.length;

	const ordinanceCount = documents.filter((d) =>
		d.type.toLowerCase().includes("ordinance"),
	).length;
	const resolutionCount = documents.filter((d) =>
		d.type.toLowerCase().includes("resolution"),
	).length;
	const committeeReportCount = documents.filter((d) =>
		d.type.toLowerCase().includes("committee"),
	).length;
	const othersCount = documents.filter((d) => {
		const t = d.type.toLowerCase();
		return (
			!t.includes("ordinance") &&
			!t.includes("resolution") &&
			!t.includes("committee")
		);
	}).length;

	return (
		<div className="flex h-full w-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<FileText className="h-5 w-5 text-gray-600" />
					<h3 className="text-base font-semibold text-gray-900">
						Ready for Agenda
					</h3>
				</div>
				<div className="flex gap-1 flex-wrap">
					<Badge
						variant="outline"
						className="text-xs bg-blue-100 text-blue-800"
					>
						{ordinanceCount} Ord.
					</Badge>
					<Badge
						variant="outline"
						className="text-xs bg-green-100 text-green-800"
					>
						{resolutionCount} Res.
					</Badge>
					{committeeReportCount > 0 && (
						<Badge
							variant="outline"
							className="text-xs bg-purple-100 text-purple-800"
						>
							{committeeReportCount} CR
						</Badge>
					)}
					{othersCount > 0 && (
						<Badge
							variant="outline"
							className="text-xs bg-orange-100 text-orange-800"
						>
							{othersCount} Other
						</Badge>
					)}
				</div>
			</div>

			<p className="text-sm text-gray-500 -mt-2">
				Approved &amp; for-agenda documents. Drag to agenda sections.
			</p>

			{/* Filters */}
			<div className="flex gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
					<Input
						placeholder="Search documents..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9 h-9 text-sm"
					/>
				</div>
				<Select value={typeFilter} onValueChange={setTypeFilter}>
					<SelectTrigger className="w-36 h-9 text-sm cursor-pointer">
						<SelectValue placeholder="Document Type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem className="cursor-pointer" value="all">
							All Types
						</SelectItem>
						<SelectItem className="cursor-pointer" value="ordinance">
							Ordinances
						</SelectItem>
						<SelectItem className="cursor-pointer" value="resolution">
							Resolutions
						</SelectItem>
						<SelectItem className="cursor-pointer" value="committee_report">
							Committee Reports
						</SelectItem>
						<SelectItem className="cursor-pointer" value="others">
							Others
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Document List */}
			<div className="flex-1 overflow-y-auto">
				<div className="flex flex-col gap-2">
					{visibleDocuments.length > 0 ? (
						<>
							{visibleDocuments.map((doc) => (
								<SessionDocumentCard
									key={doc.id}
									document={doc}
									onViewDocument={onViewDocument}
								/>
							))}
							{hasMore && (
								<button
									type="button"
									onClick={() => setDisplayCount((c) => c + DOCS_PAGE_SIZE)}
									className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
								>
									Show more ({filteredDocuments.length - displayCount}{" "}
									remaining)
								</button>
							)}
						</>
					) : (
						<div className="flex flex-col items-center justify-center py-8 text-gray-500">
							<FileText className="h-8 w-8 mb-2 text-gray-300" />
							<p className="text-sm">No documents found</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
