import type { Session } from "@repo/shared";
import { formatSessionDate, formatSessionTime } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import Link from "next/link";
import {
	getSessionStatusBadgeClass,
	getSessionStatusLabel,
	getSessionTypeBadgeClass,
	getSessionTypeLabel,
} from "@/lib/session-ui";

interface SessionListViewProps {
	sessions: Session[];
	hasActiveFilters: boolean;
	queryString?: string;
}

export function SessionListView({
	sessions,
	hasActiveFilters,
	queryString,
}: SessionListViewProps) {
	return (
		<div className="space-y-3 sm:space-y-4">
			{sessions.length > 0 ? (
				sessions.map((session) => (
					<Card
						key={session.id}
						className="rounded-xl border-[0.8px] border-[rgba(0,0,0,0.1)] bg-white p-4 sm:p-6 transition-shadow hover:shadow-lg"
					>
						<div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
							<div className="w-full flex-1 space-y-2">
								<div className="flex flex-wrap items-center gap-2 sm:gap-3">
									<Badge
										className={`rounded-md px-2 py-0.5 text-xs font-medium text-white sm:px-2.5 sm:py-1 ${getSessionTypeBadgeClass(
											session.type,
										)}`}
									>
										{getSessionTypeLabel(session.type)}
									</Badge>
									<Badge
										className={`rounded-md px-2 py-0.5 text-xs font-medium text-white sm:px-2.5 sm:py-1 ${getSessionStatusBadgeClass(
											session.status,
										)}`}
									>
										{getSessionStatusLabel(session.status)}
									</Badge>
									<span className="text-xs sm:text-sm text-[#4a5565]">
										Session #{session.sessionNumber}
									</span>
								</div>
								<h2 className="text-base sm:text-lg font-semibold leading-6 sm:leading-7 text-[#0a0a0a]">
									{formatSessionDate(session.scheduleDate)}
								</h2>
								<p className="text-xs sm:text-sm text-[#4a5565]">
									{formatSessionTime(session.scheduleDate)}
								</p>
							</div>
							<Link
								href={`/sessions/${session.id}?${queryString || "view=list"}`}
								className="w-full sm:w-auto"
							>
								<Button
									size="sm"
									className="h-8 sm:h-9 w-full sm:w-auto rounded-md bg-[#a60202] px-4 text-xs sm:text-sm text-white hover:bg-[#8a0101] cursor-pointer"
								>
									View Details
								</Button>
							</Link>
						</div>
					</Card>
				))
			) : (
				<Card className="rounded-xl border-[0.8px] border-[rgba(0,0,0,0.1)] bg-white p-12">
					<p className="text-center text-base text-[#4a5565]">
						{hasActiveFilters
							? "No sessions match your current filters."
							: "No legislative sessions scheduled at this time."}
					</p>
				</Card>
			)}
		</div>
	);
}
