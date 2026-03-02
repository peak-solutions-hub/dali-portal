import type { InquiryTicketWithMessagesAndAttachmentsResponse } from "@repo/shared";
import { formatCitizenFullName } from "@repo/shared";
import { Card, CardContent } from "@repo/ui/components/card";
import { InquiryStatusBadge } from "@repo/ui/components/inquiry-status-badge";
import {
	Clock,
	Info,
	Mail,
	MapPin,
	Phone,
	User,
	UserCheck,
} from "@repo/ui/lib/lucide-react";

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
								<InquiryStatusBadge status={ticket.status} />
							</div>
							<div
								className={`mt-3 rounded-lg px-3 py-2.5 flex gap-2 items-start ${statusCalloutStyles[ticket.status]}`}
							>
								<Info className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-70" />
								<p className="text-xs leading-relaxed">
									{statusDescriptions[ticket.status]}
								</p>
							</div>
						</div>

						<div>
							<p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
								Handled By
							</p>
							{ticket.user ? (
								<div className="flex items-center gap-2 mt-1 text-sm font-medium">
									<div className="bg-gray-100 p-1.5 rounded-full shrink-0">
										<UserCheck className="h-3 w-3 text-gray-600" />
									</div>
									<span className="break-words min-w-0 line-clamp-2">
										{ticket.user.fullName}
									</span>
								</div>
							) : (
								<p className="text-sm text-gray-400 italic mt-1">
									Pending assignment
								</p>
							)}
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
									<div className="bg-gray-100 p-1.5 rounded-full shrink-0">
										<User className="h-3 w-3 text-gray-600" />
									</div>
									<span className="break-words min-w-0 line-clamp-2">
										{formatCitizenFullName(ticket)}
									</span>
								</div>
								{ticket.citizenEmail && (
									<div className="flex items-center gap-2 text-sm font-medium">
										<div className="bg-gray-100 p-1.5 rounded-full shrink-0">
											<Mail className="h-3 w-3 text-gray-600" />
										</div>
										<span className="break-all min-w-0 line-clamp-2">
											{ticket.citizenEmail}
										</span>
									</div>
								)}
								{ticket.citizenContactNumber && (
									<div className="flex items-center gap-2 text-sm font-medium">
										<div className="bg-gray-100 p-1.5 rounded-full shrink-0">
											<Phone className="h-3 w-3 text-gray-600" />
										</div>
										<span className="break-words min-w-0 line-clamp-2">
											{ticket.citizenContactNumber}
										</span>
									</div>
								)}
								{ticket.citizenAddress && (
									<div className="flex items-center gap-2 text-sm font-medium">
										<div className="bg-gray-100 p-1.5 rounded-full shrink-0">
											<MapPin className="h-3 w-3 text-gray-600" />
										</div>
										<span className="break-words min-w-0 line-clamp-2">
											{ticket.citizenAddress}
										</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const statusDescriptions: Record<string, string> = {
	new: "Your inquiry has been received and is waiting to be reviewed by our staff.",
	open: "Our staff is currently reviewing and working on your inquiry.",
	waiting_for_citizen:
		"Our staff has replied and is waiting for your response. Please check the conversation.",
	resolved: "Your inquiry has been reviewed and resolved by our staff.",
	rejected:
		"Your inquiry has been closed. Please contact us if you need further assistance.",
};

const statusCalloutStyles: Record<string, string> = {
	new: "bg-gray-100 text-gray-800 border border-gray-200",
	open: "bg-blue-50 text-blue-800 border border-blue-200",
	waiting_for_citizen: "bg-yellow-50 text-yellow-800 border border-yellow-200",
	resolved: "bg-green-50 text-green-800 border border-green-200",
	rejected: "bg-red-50 text-red-800 border border-red-200",
};

function formatCategory(category: string) {
	return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
