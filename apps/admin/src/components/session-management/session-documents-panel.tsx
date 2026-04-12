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
import { useEffect, useId, useMemo, useState } from "react";
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
	const documentSearchId = useId();
	const documentTypeFilterId = useId();
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");

	const filteredDocuments = useMemo(() => {
		return documents.filter((doc) => {
			// Type filter
			if (typeFilter !== "all") {
				const typeLower = doc.type.toLowerCase();
				if (
					typeFilter === "privilege_speech" &&
					!typeLower.includes("privilege_speech")
				) {
					return false;
				}
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
					// Show all documents that are NOT known legislative session document types
					if (
						typeLower.includes("ordinance") ||
						typeLower.includes("resolution") ||
						typeLower.includes("committee") ||
						typeLower.includes("privilege_speech")
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
	const privilegeSpeechCount = documents.filter((d) =>
		d.type.toLowerCase().includes("privilege_speech"),
	).length;
	const othersCount = documents.filter((d) => {
		const t = d.type.toLowerCase();
		return (
			!t.includes("ordinance") &&
			!t.includes("resolution") &&
			!t.includes("committee") &&
			!t.includes("privilege_speech")
		);
	}).length;

	return (
		<div className="flex h-full w-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<FileText className="h-5 w-5 text-gray-600" aria-hidden="true" />
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
					{privilegeSpeechCount > 0 && (
						<Badge
							variant="outline"
							className="text-xs bg-red-100 text-red-800"
						>
							{privilegeSpeechCount} Priv. Speech
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
			<div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px]">
				<div className="space-y-1">
					<label
						htmlFor={documentSearchId}
						className="text-xs font-semibold tracking-wide text-gray-700"
					>
						Search Documents
					</label>
					<div className="relative">
						<Search
							className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
							aria-hidden="true"
						/>
						<Input
							id={documentSearchId}
							aria-label="Search documents"
							placeholder="Search documents..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-10 border-gray-300 pl-9 text-sm font-medium text-gray-900"
						/>
					</div>
				</div>
				<div className="space-y-1">
					<label
						htmlFor={documentTypeFilterId}
						className="text-xs font-semibold tracking-wide text-gray-700"
					>
						Filter by Type
					</label>
					<Select value={typeFilter} onValueChange={setTypeFilter}>
						<SelectTrigger
							id={documentTypeFilterId}
							aria-label="Filter documents by type"
							className="h-10 w-full cursor-pointer border-gray-300 bg-white text-sm font-medium text-gray-900 focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2"
						>
							<SelectValue placeholder="All Types" />
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
							<SelectItem className="cursor-pointer" value="privilege_speech">
								Privilege Speech
							</SelectItem>
							<SelectItem className="cursor-pointer" value="others">
								Others
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Document List */}
			<div className="flex-1 overflow-y-auto">
				{visibleDocuments.length > 0 ? (
					<div className="flex flex-col gap-2">
						<ul role="list" className="flex flex-col gap-2">
							{visibleDocuments.map((doc) => (
								<li key={doc.id} className="list-none">
									<SessionDocumentCard
										document={doc}
										onViewDocument={onViewDocument}
									/>
								</li>
							))}
						</ul>
						{hasMore && (
							<button
								type="button"
								onClick={() => setDisplayCount((c) => c + DOCS_PAGE_SIZE)}
								className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2"
							>
								Show more ({filteredDocuments.length - displayCount} remaining)
							</button>
						)}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-8 text-gray-500">
						<FileText
							className="h-8 w-8 mb-2 text-gray-300"
							aria-hidden="true"
						/>
						<p className="text-sm">No documents found</p>
					</div>
				)}
			</div>
		</div>
	);
}
