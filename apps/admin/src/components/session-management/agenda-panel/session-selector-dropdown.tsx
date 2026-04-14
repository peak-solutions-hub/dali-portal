"use client";

import type { SessionManagementSession as Session } from "@repo/shared";
import { formatSessionDate, formatSessionTime } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { ChevronDown, Search, X } from "@repo/ui/lib/lucide-react";
import {
	getSessionStatusBadgeClass,
	getSessionStatusLabel,
	getSessionTypeLabel,
} from "@repo/ui/lib/session-ui";
import { useId, useState } from "react";

const SESSIONS_PER_GROUP = 5;

const toPhtDateTime = (date: string, time: string): string => {
	if (!date || !time) return "";
	return `${date}T${time}:00+08:00`;
};

const normalizeSessionSearchQuery = (query: string): string => {
	return query.trim().toLowerCase().replace(/\s+/g, " ");
};

const buildSessionNumberSearchAliases = (sessionNumber: number): string[] => {
	const sessionNumberText = sessionNumber.toString();
	return [
		sessionNumberText,
		`#${sessionNumberText}`,
		`session #${sessionNumberText}`,
		`session ${sessionNumberText}`,
	];
};

interface SessionSelectorDropdownProps {
	sessions: Session[];
	selectedSession: Session | null;
	onSessionChange: (sessionId: string) => void;
	hasNextPage?: boolean;
	isFetchingNextPage?: boolean;
	onLoadMoreSessions?: () => void;
}

export function SessionSelectorDropdown({
	sessions,
	selectedSession,
	onSessionChange,
	hasNextPage,
	isFetchingNextPage,
	onLoadMoreSessions,
}: SessionSelectorDropdownProps) {
	const currentSessionLabelId = useId();
	const currentSessionPickerId = useId();
	const searchLabelId = useId();
	const searchInputId = useId();
	const typeFilterLabelId = useId();
	const typeFilterSelectId = useId();
	const statusFilterLabelId = useId();
	const statusFilterSelectId = useId();

	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showSessionDropdown, setShowSessionDropdown] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const normalizedSearchQuery = normalizeSessionSearchQuery(searchQuery);
	const [groupLimits, setGroupLimits] = useState({
		draft: SESSIONS_PER_GROUP,
		scheduled: SESSIONS_PER_GROUP,
		completed: SESSIONS_PER_GROUP,
	});

	const handleSelectSession = (sessionId: string) => {
		onSessionChange(sessionId);
		setShowSessionDropdown(false);
		setSearchQuery("");
		setTypeFilter("all");
		setStatusFilter("all");
	};

	const filteredSessions = sessions.filter((session) => {
		if (typeFilter !== "all" && session.type !== typeFilter) return false;
		if (statusFilter !== "all" && session.status !== statusFilter) return false;
		if (normalizedSearchQuery) {
			const numericQuery = normalizedSearchQuery.replace(/[^\d]/g, "");
			const matchesSessionNumber =
				buildSessionNumberSearchAliases(session.sessionNumber).some((alias) =>
					alias.includes(normalizedSearchQuery),
				) ||
				(numericQuery.length > 0 &&
					session.sessionNumber.toString().includes(numericQuery));

			return (
				matchesSessionNumber ||
				formatSessionDate(session.date)
					.toLowerCase()
					.includes(normalizedSearchQuery) ||
				getSessionTypeLabel(session.type)
					.toLowerCase()
					.includes(normalizedSearchQuery)
			);
		}
		return true;
	});

	const groupedSessions = {
		draft: filteredSessions.filter((s) => s.status === "draft"),
		scheduled: filteredSessions.filter((s) => s.status === "scheduled"),
		completed: filteredSessions.filter((s) => s.status === "completed"),
	};

	const hasActiveFilters =
		typeFilter !== "all" ||
		statusFilter !== "all" ||
		normalizedSearchQuery.length > 0;

	return (
		<div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
			<label
				id={currentSessionLabelId}
				htmlFor={currentSessionPickerId}
				className="block text-sm font-semibold text-gray-800 mb-1.5"
			>
				Current Session
			</label>
			<Popover open={showSessionDropdown} onOpenChange={setShowSessionDropdown}>
				<PopoverTrigger asChild>
					{/*
					 * Trigger: two-line layout kept but reduced vertical padding.
					 * py-6 → py-3 saves ~24px without losing readability.
					 */}
					<Button
						id={currentSessionPickerId}
						variant="outline"
						aria-labelledby={currentSessionLabelId}
						className="h-auto w-full justify-between border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all hover:border-[#a60202] hover:bg-gray-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2"
					>
						{selectedSession ? (
							<div className="flex-1 text-left">
								<div className="flex items-center gap-2">
									<span className="text-sm font-semibold text-gray-900">
										Session #{selectedSession.sessionNumber}
									</span>
									<span
										className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${getSessionStatusBadgeClass(selectedSession.status)} text-white`}
									>
										{getSessionStatusLabel(selectedSession.status)}
									</span>
								</div>
								<div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
									<span>{getSessionTypeLabel(selectedSession.type)}</span>
									<span>•</span>
									<span>{formatSessionDate(selectedSession.date)}</span>
									<span>•</span>
									<span>
										{formatSessionTime(
											toPhtDateTime(selectedSession.date, selectedSession.time),
										)}
									</span>
								</div>
							</div>
						) : (
							<span className="text-gray-500 text-sm">Select a session...</span>
						)}
						<ChevronDown
							className={`h-4 w-4 text-gray-400 shrink-0 ml-2 transition-transform ${showSessionDropdown ? "rotate-180" : ""}`}
							aria-hidden="true"
						/>
					</Button>
				</PopoverTrigger>

				<PopoverContent
					className="p-0"
					align="start"
					style={{ width: "var(--radix-popover-trigger-width)" }}
				>
					<div className="flex flex-col w-full">
						{/* Search + filters — slightly tighter than original p-4 */}
						<div className="p-3 space-y-2.5 border-b border-gray-200">
							<div className="space-y-1">
								<label
									id={searchLabelId}
									htmlFor={searchInputId}
									className="text-xs font-semibold tracking-wide text-gray-700"
								>
									Search Session
								</label>
								<div className="relative">
									<Search
										className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
										aria-hidden="true"
									/>
									<Input
										id={searchInputId}
										type="text"
										aria-labelledby={searchLabelId}
										placeholder="Search by number, type, or date"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="h-9 border-gray-300 bg-white pl-9 text-sm font-medium text-gray-900"
									/>
								</div>
							</div>

							{/* Filters + inline Clear */}
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<div className="space-y-1">
									<label
										id={typeFilterLabelId}
										htmlFor={typeFilterSelectId}
										className="text-xs font-semibold tracking-wide text-gray-700"
									>
										All Types
									</label>
									<Select value={typeFilter} onValueChange={setTypeFilter}>
										<SelectTrigger
											id={typeFilterSelectId}
											aria-labelledby={typeFilterLabelId}
											className="h-9 w-full cursor-pointer border-gray-300 bg-white text-sm font-medium text-gray-900 focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2"
										>
											<SelectValue placeholder="All Types" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all" className="cursor-pointer">
												All Types
											</SelectItem>
											<SelectItem value="regular" className="cursor-pointer">
												Regular
											</SelectItem>
											<SelectItem value="special" className="cursor-pointer">
												Special
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<label
										id={statusFilterLabelId}
										htmlFor={statusFilterSelectId}
										className="text-xs font-semibold tracking-wide text-gray-700"
									>
										All Statuses
									</label>
									<Select value={statusFilter} onValueChange={setStatusFilter}>
										<SelectTrigger
											id={statusFilterSelectId}
											aria-labelledby={statusFilterLabelId}
											className="h-9 w-full cursor-pointer border-gray-300 bg-white text-sm font-medium text-gray-900 focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2"
										>
											<SelectValue placeholder="All Statuses" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all" className="cursor-pointer">
												All Statuses
											</SelectItem>
											<SelectItem value="draft" className="cursor-pointer">
												Draft
											</SelectItem>
											<SelectItem value="scheduled" className="cursor-pointer">
												Scheduled
											</SelectItem>
											<SelectItem value="completed" className="cursor-pointer">
												Completed
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="flex justify-end">
								{hasActiveFilters && (
									<button
										type="button"
										onClick={() => {
											setTypeFilter("all");
											setStatusFilter("all");
											setSearchQuery("");
										}}
										className="inline-flex h-9 items-center gap-1 rounded border border-[#a60202] bg-red-50 px-3 text-xs font-semibold text-[#a60202] transition-colors hover:bg-red-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2"
									>
										<X className="h-3 w-3" aria-hidden="true" />
										Clear
									</button>
								)}
							</div>

							{/* Result count */}
							<p className="text-xs text-gray-500">
								{hasActiveFilters
									? `${filteredSessions.length} of ${sessions.length} sessions found`
									: `${sessions.length} session${sessions.length !== 1 ? "s" : ""} total`}
							</p>
						</div>

						{/* Sessions list — h-72 (down from h-96, up from h-56) */}
						<div className="p-3 h-72 overflow-y-auto">
							<div className="space-y-3">
								{groupedSessions.draft.length > 0 &&
									(statusFilter === "all" || statusFilter === "draft") && (
										<SessionGroup
											label="Draft"
											dotColor="bg-gray-400"
											sessions={groupedSessions.draft}
											limit={groupLimits.draft}
											selectedSessionId={selectedSession?.id}
											onSelect={handleSelectSession}
											onShowMore={() =>
												setGroupLimits((prev) => ({
													...prev,
													draft: prev.draft + SESSIONS_PER_GROUP,
												}))
											}
										/>
									)}

								{groupedSessions.scheduled.length > 0 &&
									(statusFilter === "all" || statusFilter === "scheduled") && (
										<SessionGroup
											label="Scheduled"
											dotColor="bg-blue-500"
											sessions={groupedSessions.scheduled}
											limit={groupLimits.scheduled}
											selectedSessionId={selectedSession?.id}
											onSelect={handleSelectSession}
											onShowMore={() =>
												setGroupLimits((prev) => ({
													...prev,
													scheduled: prev.scheduled + SESSIONS_PER_GROUP,
												}))
											}
										/>
									)}

								{groupedSessions.completed.length > 0 &&
									(statusFilter === "all" || statusFilter === "completed") && (
										<SessionGroup
											label="Completed"
											dotColor="bg-green-500"
											sessions={groupedSessions.completed}
											limit={groupLimits.completed}
											selectedSessionId={selectedSession?.id}
											onSelect={handleSelectSession}
											onShowMore={() =>
												setGroupLimits((prev) => ({
													...prev,
													completed: prev.completed + SESSIONS_PER_GROUP,
												}))
											}
										/>
									)}

								{filteredSessions.length === 0 && (
									<div className="text-center py-8">
										<p className="text-sm text-gray-500 mb-1">
											No sessions found
										</p>
										<p className="text-xs text-gray-400">
											Try adjusting your filters or search query
										</p>
									</div>
								)}

								{hasNextPage && (
									<button
										type="button"
										onClick={() => onLoadMoreSessions?.()}
										disabled={isFetchingNextPage}
										className="w-full mt-1 py-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2"
									>
										{isFetchingNextPage
											? "Loading more sessions..."
											: "Load more sessions"}
									</button>
								)}
							</div>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}

function SessionGroup({
	label,
	dotColor,
	sessions,
	limit,
	selectedSessionId,
	onSelect,
	onShowMore,
}: {
	label: string;
	dotColor: string;
	sessions: Session[];
	limit: number;
	selectedSessionId?: string;
	onSelect: (id: string) => void;
	onShowMore: () => void;
}) {
	return (
		<div>
			<div className="flex items-center gap-2 px-2 mb-1.5">
				<div className={`h-2 w-2 rounded-full ${dotColor}`} />
				<h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
					{label} ({sessions.length})
				</h3>
			</div>
			<div className="space-y-0.5">
				{sessions.slice(0, limit).map((session) => (
					<button
						key={session.id}
						type="button"
						onClick={() => onSelect(session.id)}
						className={`w-full text-left px-3 py-2 rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2 ${
							selectedSessionId === session.id
								? "bg-red-50 border border-[#a60202]"
								: "hover:bg-gray-50 border border-transparent"
						}`}
					>
						<div className="flex items-center gap-2 mb-0.5">
							<span className="text-sm font-semibold text-gray-900">
								Session #{session.sessionNumber}
							</span>
							<span
								className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${getSessionStatusBadgeClass(session.status)} text-white`}
							>
								{getSessionStatusLabel(session.status)}
							</span>
						</div>
						<div className="flex items-center gap-1.5 text-xs text-gray-500">
							<span>{getSessionTypeLabel(session.type)}</span>
							<span>•</span>
							<span>{formatSessionDate(session.date)}</span>
							{session.time && (
								<>
									<span>•</span>
									<span>
										{formatSessionTime(
											toPhtDateTime(session.date, session.time),
										)}
									</span>
								</>
							)}
						</div>
					</button>
				))}
				{sessions.length > limit && (
					<button
						type="button"
						onClick={onShowMore}
						className="w-full mt-1 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2"
					>
						Show more ({sessions.length - limit} remaining)
					</button>
				)}
			</div>
		</div>
	);
}
