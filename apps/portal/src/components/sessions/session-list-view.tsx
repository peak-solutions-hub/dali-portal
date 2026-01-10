import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import Link from "next/link";
import type { Session } from "@/types/session";

interface SessionListViewProps {
	sessions: Session[];
	hasActiveFilters: boolean;
}

function formatDate(dateString: string) {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function SessionListView({
	sessions,
	hasActiveFilters,
}: SessionListViewProps) {
	return (
		<div className="space-y-3 sm:space-y-4">
			{sessions.length > 0 ? (
				sessions.map((session) => (
					<Card
						key={session.id}
						className="rounded-xl border-[0.8px] border-[rgba(0,0,0,0.1)] bg-white p-4 sm:p-6"
					>
						<div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
							<div className="flex-1 space-y-2 w-full">
								<div className="flex flex-wrap items-center gap-2 sm:gap-3">
									<Badge
										className={`rounded-md px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium text-white ${
											session.type === "regular"
												? "bg-[#dc2626]"
												: "bg-[#fe9a00]"
										}`}
									>
										{session.type === "regular"
											? "Regular Session"
											: "Special Session"}
									</Badge>
									<Badge
										className={`rounded-md px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium ${
											session.status === "completed"
												? "bg-[#16a34a] text-white"
												: "bg-[#3b82f6] text-white"
										}`}
									>
										{session.status === "completed" ? "Completed" : "Scheduled"}
									</Badge>
									<span className="text-xs sm:text-sm text-[#4a5565]">
										Session #{session.sessionNumber}
									</span>
								</div>
								<h2 className="text-base sm:text-lg font-semibold leading-6 sm:leading-7 text-[#0a0a0a]">
									{formatDate(session.date)}
								</h2>
								<p className="text-xs sm:text-sm text-[#4a5565]">
									Time: {session.time}
								</p>
							</div>
							<Link
								href={`/sessions/${session.id}`}
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
