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
import { useState } from "react";

const SESSIONS_PER_GROUP = 5;

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
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showSessionDropdown, setShowSessionDropdown] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
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

	// Filter sessions based on type, status, and search query
	const filteredSessions = sessions.filter((session) => {
		if (typeFilter !== "all" && session.type !== typeFilter) return false;
		if (statusFilter !== "all" && session.status !== statusFilter) return false;

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			const sessionNum = session.sessionNumber.toString();
			const date = formatSessionDate(session.date).toLowerCase();
			const type = getSessionTypeLabel(session.type).toLowerCase();

			return (
				sessionNum.includes(query) ||
				date.includes(query) ||
				type.includes(query)
			);
		}

		return true;
	});

	// Group sessions by status
	const groupedSessions = {
		draft: filteredSessions.filter((s) => s.status === "draft"),
		scheduled: filteredSessions.filter((s) => s.status === "scheduled"),
		completed: filteredSessions.filter((s) => s.status === "completed"),
	};

	const hasActiveFilters =
		typeFilter !== "all" || statusFilter !== "all" || searchQuery;

	return (
		<div className="border-b border-gray-200 pb-3">
			<label className="block text-sm font-medium text-gray-700 mb-2">
				Current Session
			</label>
			<Popover open={showSessionDropdown} onOpenChange={setShowSessionDropdown}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className="w-full justify-between px-4 py-6 h-auto border-2 hover:border-[#a60202] hover:bg-gray-50 transition-all cursor-pointer"
					>
						{selectedSession ? (
							<div className="flex-1 text-left">
								<div className="flex items-center gap-2">
									<span className="text-base font-semibold text-gray-900">
										Session #{selectedSession.sessionNumber}
									</span>
									<span
										className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getSessionStatusBadgeClass(selectedSession.status)} text-white`}
									>
										{getSessionStatusLabel(selectedSession.status)}
									</span>
								</div>
								<div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
									<span>{getSessionTypeLabel(selectedSession.type)}</span>
									<span>•</span>
									<span>{formatSessionDate(selectedSession.date)}</span>
									<span>•</span>
									<span>
										{formatSessionTime(
											`${selectedSession.date}T${selectedSession.time}`,
										)}
									</span>
								</div>
							</div>
						) : (
							<span className="text-gray-500">Select a session...</span>
						)}
						<ChevronDown
							className={`h-5 w-5 text-gray-400 transition-transform ${showSessionDropdown ? "rotate-180" : ""}`}
						/>
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="p-0"
					align="start"
					style={{ width: "var(--radix-popover-trigger-width)" }}
				>
					<div className="flex flex-col w-full">
						{/* Search and Filters */}
						<div className="p-4 space-y-3 border-b border-gray-200 shrink-0 w-full">
							{/* Search */}
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
								<Input
									type="text"
									placeholder="Search sessions..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9"
								/>
							</div>

							{/* Filters Row */}
							<div className="flex gap-2">
								<Select value={typeFilter} onValueChange={setTypeFilter}>
									<SelectTrigger className="flex-1 h-8 text-xs cursor-pointer">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Types</SelectItem>
										<SelectItem value="regular">Regular</SelectItem>
										<SelectItem value="special">Special</SelectItem>
									</SelectContent>
								</Select>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className="flex-1 h-8 text-xs cursor-pointer">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Statuses</SelectItem>
										<SelectItem value="draft">Draft</SelectItem>
										<SelectItem value="scheduled">Scheduled</SelectItem>
										<SelectItem value="completed">Completed</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Active Filters Summary */}
							<div className="flex items-center justify-between text-xs min-h-5">
								{hasActiveFilters ? (
									<>
										<span className="text-gray-600">
											{filteredSessions.length} session
											{filteredSessions.length !== 1 ? "s" : ""} found
										</span>
										<button
											onClick={() => {
												setTypeFilter("all");
												setStatusFilter("all");
												setSearchQuery("");
											}}
											className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-[#a60202] hover:bg-red-100 font-medium transition-colors cursor-pointer"
										>
											<X className="h-3 w-3" />
											Clear filters
										</button>
									</>
								) : (
									<span className="text-gray-500">
										{sessions.length} session
										{sessions.length !== 1 ? "s" : ""} total
									</span>
								)}
							</div>
						</div>

						{/* Sessions List */}
						<div className="p-3 h-96 overflow-y-auto shrink-0 w-full">
							<div className="space-y-4">
								{/* Draft Sessions */}
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

								{/* Scheduled Sessions */}
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

								{/* Completed Sessions */}
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

								{/* No Results */}
								{filteredSessions.length === 0 && (
									<div className="text-center py-8">
										<p className="text-sm text-gray-500 mb-3">
											No sessions found
										</p>
										<p className="text-xs text-gray-400 mb-4">
											Try adjusting your filters or search query
										</p>
									</div>
								)}

								{/* Load more sessions from server */}
								{hasNextPage && (
									<button
										type="button"
										onClick={() => onLoadMoreSessions?.()}
										disabled={isFetchingNextPage}
										className="w-full mt-2 py-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

/** Renders a status-grouped list of session buttons with "Show more" pagination */
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
			<div className="flex items-center gap-2 px-2 mb-2">
				<div className={`h-2 w-2 rounded-full ${dotColor}`} />
				<h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
					{label} ({sessions.length})
				</h3>
			</div>
			<div className="space-y-1">
				{sessions.slice(0, limit).map((session) => (
					<button
						key={session.id}
						onClick={() => onSelect(session.id)}
						className={`w-full text-left px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
							selectedSessionId === session.id
								? "bg-red-50 border border-[#a60202]"
								: "hover:bg-gray-50 border border-transparent"
						}`}
					>
						<div className="flex items-center gap-2 mb-1">
							<span className="text-sm font-semibold text-gray-900">
								Session #{session.sessionNumber}
							</span>
							<span
								className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${getSessionStatusBadgeClass(session.status)} text-white`}
							>
								{getSessionStatusLabel(session.status)}
							</span>
						</div>
						<div className="flex items-center gap-1.5 text-xs text-gray-600">
							<span className="font-medium">
								{getSessionTypeLabel(session.type)}
							</span>
							<span>•</span>
							<span>{formatSessionDate(session.date)}</span>
							{session.time && (
								<>
									<span>•</span>
									<span>
										{formatSessionTime(`${session.date}T${session.time}`)}
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
						className="w-full mt-1 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
					>
						Show more ({sessions.length - limit} remaining)
					</button>
				)}
			</div>
		</div>
	);
}
