import type { InquiryTicketWithMessagesAndAttachmentsResponse } from "@repo/shared";
import { InquiryStatus } from "@repo/shared";
import { Card, CardContent } from "@repo/ui/components/card";
import { CheckCircle2, Clock, Mail, User } from "@repo/ui/lib/lucide-react";

interface InquirySidebarProps {
	ticket: InquiryTicketWithMessagesAndAttachmentsResponse;
}

export function InquirySidebar({ ticket }: InquirySidebarProps) {
	return (
		<div className="space-y-6">
			<Card className="border-none shadow-md bg-white border-l-4 border-l-[#a60202]">
				<CardContent className="p-6 text-gray-900">
					<h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 pb-2 border-b border-gray-100">
						Ticket Details
					</h3>

					<div className="space-y-6">
						<div>
							<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
								Status
							</p>
							<div className="mt-1">
								<StatusBadge status={ticket.status} />
							</div>
						</div>

						<div>
							<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
								Category
							</p>
							<p className="text-sm font-medium">
								{formatCategory(ticket.category)}
							</p>
						</div>

						<div>
							<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
								Date Created
							</p>
							<div className="flex items-center gap-2 mt-1 text-sm font-medium">
								<Clock className="h-3 w-3 text-[#a60202]" />
								{new Date(ticket.createdAt).toLocaleDateString("en-US", {
									month: "long",
									day: "numeric",
									year: "numeric",
								})}
							</div>
						</div>

						<div className="pt-6 border-t border-gray-100">
							<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-3">
								Your Information
							</p>
							<div className="space-y-2">
								<div className="flex items-center gap-2 text-sm font-medium">
									<div className="bg-gray-100 p-1.5 rounded-full">
										<User className="h-3 w-3 text-gray-600" />
									</div>
									{ticket.citizenName}
								</div>
								<div className="flex items-center gap-2 text-sm font-medium">
									<div className="bg-gray-100 p-1.5 rounded-full">
										<Mail className="h-3 w-3 text-gray-600" />
									</div>
									{ticket.citizenEmail}
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{ticket.status === "resolved" && ticket.closureRemarks && (
				<Card className="border-green-200 bg-green-50 shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-start gap-3">
							<CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
							<div>
								<p className="font-semibold text-green-800 text-sm">
									Resolution Remarks
								</p>
								<p className="text-sm text-green-700 mt-1">
									{ticket.closureRemarks}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: InquiryStatus }) {
	const styles: Record<string, string> = {
		new: "bg-blue-100 text-blue-700 border-blue-200",
		open: "bg-yellow-100 text-yellow-700 border-yellow-200",
		waiting_for_citizen: "bg-orange-100 text-orange-700 border-orange-200",
		resolved: "bg-green-100 text-green-700 border-green-200",
		rejected: "bg-gray-100 text-gray-700 border-gray-200",
	};

	const labels: Record<string, string> = {
		new: "New",
		open: "Open",
		waiting_for_citizen: "Waiting for Citizen",
		resolved: "Resolved",
		rejected: "Rejected",
	};

	const cn = styles[status] ?? "bg-gray-100 text-gray-600";
	const label = labels[status] ?? status;

	return (
		<span className={`px-2 py-1 text-xs rounded-full font-medium border ${cn}`}>
			{label}
		</span>
	);
}

function formatCategory(category: string) {
	return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
