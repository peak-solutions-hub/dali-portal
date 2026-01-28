import type { InquiryTicketWithMessagesResponse } from "@repo/shared";
import { Separator } from "@repo/ui/components/separator";
import { Calendar, Mail, Tag, User } from "lucide-react";
import { formatInquiryCategory } from "@/utils/inquiry-helpers";
import { InquiryStatusBadge } from "./inquiry-status-badge";

interface InquiryTicketHeaderProps {
	ticket: InquiryTicketWithMessagesResponse;
}

export function InquiryTicketHeader({ ticket }: InquiryTicketHeaderProps) {
	return (
		<div className="border-b bg-muted/30 p-4 space-y-4">
			<div className="flex items-start gap-4">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-3 py-2">
						<h1 className="text-xl font-semibold leading-tight">
							{ticket.subject}
						</h1>
						<InquiryStatusBadge status={ticket.status} />
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						{ticket.referenceNumber}
					</p>
				</div>
			</div>

			<Separator />

			<div className="space-y-3">
				<h3 className="font-semibold">Citizen Information</h3>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<User className="h-3 w-3" />
							Name
						</div>
						<p className="text-sm">{ticket.citizenName}</p>
					</div>
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<Mail className="h-3 w-3" />
							Email
						</div>
						<p className="text-sm">{ticket.citizenEmail}</p>
					</div>
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<Calendar className="h-3 w-3" />
							Date Submitted
						</div>
						<p className="text-sm">
							{new Date(ticket.createdAt).toLocaleString("en-US", {
								month: "short",
								day: "numeric",
								year: "numeric",
								hour: "numeric",
								minute: "2-digit",
								hour12: true,
							})}
						</p>
					</div>
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<Tag className="h-3 w-3" />
							Request Type
						</div>
						<p className="text-sm">{formatInquiryCategory(ticket.category)}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
