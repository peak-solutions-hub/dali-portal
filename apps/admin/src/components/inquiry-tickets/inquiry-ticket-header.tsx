"use client";

import type { InquiryTicketWithMessagesResponse } from "@repo/shared";
import { Separator } from "@repo/ui/components/separator";
import { cn } from "@repo/ui/lib/utils";
import { Calendar, ChevronDown, Mail, Tag, User } from "lucide-react";
import { useState } from "react";
import { formatInquiryCategory } from "@/utils/inquiry-helpers";
import { InquiryStatusBadge } from "./inquiry-status-badge";

interface InquiryTicketHeaderProps {
	ticket: InquiryTicketWithMessagesResponse;
}

export function InquiryTicketHeader({ ticket }: InquiryTicketHeaderProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="border-b bg-muted/30 p-4 pl-6 space-y-4 ">
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

			<div className="space-y-1">
				<div
					role="button"
					tabIndex={0}
					onClick={() => setIsExpanded(!isExpanded)}
					onKeyDown={(e) => e.key === "Enter" && setIsExpanded(!isExpanded)}
					className="w-full text-left group p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-all space-y-3 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
							{isExpanded ? "Citizen Information" : "Citizen Information..."}
						</h3>
						<div className="flex items-center gap-2">
							{!isExpanded && (
								<span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
									Click to expand
								</span>
							)}
							<ChevronDown
								className={cn(
									"h-4 w-4 text-primary opacity-50 group-hover:opacity-100 transition-all duration-200",
									isExpanded && "rotate-180",
								)}
							/>
						</div>
					</div>

					{isExpanded && (
						<div
							className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200 cursor-default"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="space-y-1">
								<div className="flex items-center gap-2 text-xs text-muted-foreground">
									<User className="h-3 w-3" />
									Name
								</div>
								<p className="text-sm font-medium">{ticket.citizenName}</p>
							</div>
							<div className="space-y-1">
								<div className="flex items-center gap-2 text-xs text-muted-foreground">
									<Mail className="h-3 w-3" />
									Email
								</div>
								<p className="text-sm font-medium">{ticket.citizenEmail}</p>
							</div>
							<div className="space-y-1">
								<div className="flex items-center gap-2 text-xs text-muted-foreground">
									<Calendar className="h-3 w-3" />
									Date Submitted
								</div>
								<p className="text-sm font-medium">
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
								<p className="text-sm font-medium">
									{formatInquiryCategory(ticket.category)}
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
