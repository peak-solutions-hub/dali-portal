"use client";

import type { InquiryTicketWithMessagesResponse } from "@repo/shared";
import {
	formatCitizenDisplayName,
	formatDateTimeInPHT,
	formatInquiryCategory,
} from "@repo/shared";
import { InquiryStatusBadge } from "@repo/ui/components/inquiry-status-badge";
import { Separator } from "@repo/ui/components/separator";
import { cn } from "@repo/ui/lib/utils";
import {
	Calendar,
	ChevronDown,
	Mail,
	MapPin,
	Phone,
	Tag,
	User,
} from "lucide-react";
import { useState } from "react";

interface InquiryTicketHeaderProps {
	ticket: InquiryTicketWithMessagesResponse;
}

export function InquiryTicketHeader({ ticket }: InquiryTicketHeaderProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="border-b bg-muted/30 p-3 pl-5 space-y-3">
			<div className="flex items-start gap-4">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-3 py-1">
						<h1
							className="text-base font-semibold leading-tight truncate max-w-200"
							title={ticket.subject}
						>
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
					<div className="flex items-start gap-2">
						<div className="flex-1 min-w-0 space-y-3">
							{/* Collapsed: name + contact preview */}
							{!isExpanded && (
								<div className="grid grid-cols-2 gap-x-4">
									<div className="space-y-0.5 min-w-0">
										<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
											<User className="h-3 w-3 shrink-0" />
											Name
										</div>
										<p className="text-sm font-medium truncate">
											{formatCitizenDisplayName(ticket)}
										</p>
									</div>
									<div className="space-y-0.5 min-w-0">
										<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
											<Phone className="h-3 w-3 shrink-0" />
											Contact Number
										</div>
										<p className="text-sm font-medium truncate">
											{ticket.citizenContactNumber ?? "\u2014"}
										</p>
									</div>
								</div>
							)}

							{/* Expanded: section title */}
							{isExpanded && (
								<h3 className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
									Citizen Information
								</h3>
							)}

							{/* Expanded: full grid */}
							{isExpanded && (
								<div
									className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-200 cursor-default"
									onClick={(e) => e.stopPropagation()}
								>
									<div className="space-y-0.5 min-w-0 overflow-hidden">
										<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
											<User className="h-3 w-3 shrink-0" />
											Name
										</div>
										<p className="text-sm font-medium truncate">
											{formatCitizenDisplayName(ticket)}
										</p>
									</div>
									{ticket.citizenEmail && (
										<div className="space-y-0.5 min-w-0 overflow-hidden">
											<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
												<Mail className="h-3 w-3 shrink-0" />
												Email
											</div>
											<p className="text-sm font-medium truncate">
												{ticket.citizenEmail}
											</p>
										</div>
									)}
									<div className="space-y-0.5 min-w-0 overflow-hidden">
										<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
											<Phone className="h-3 w-3 shrink-0" />
											Contact Number
										</div>
										<p className="text-sm font-medium truncate">
											{ticket.citizenContactNumber ?? "\u2014"}
										</p>
									</div>
									<div className="space-y-0.5 min-w-0 overflow-hidden">
										<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
											<MapPin className="h-3 w-3 shrink-0" />
											Address
										</div>
										<p className="text-sm font-medium line-clamp-2 break-all">
											{ticket.citizenAddress ?? "\u2014"}
										</p>
									</div>
									<div className="space-y-0.5 min-w-0 overflow-hidden">
										<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
											<Calendar className="h-3 w-3 shrink-0" />
											Date Submitted
										</div>
										<p className="text-sm font-medium truncate">
											{formatDateTimeInPHT(ticket.createdAt)}
										</p>
									</div>
									<div className="space-y-0.5 min-w-0 overflow-hidden">
										<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
											<Tag className="h-3 w-3 shrink-0" />
											Request Type
										</div>
										<p className="text-sm font-medium truncate">
											{formatInquiryCategory(ticket.category)}
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Chevron always on the right */}
						<div className="flex items-center gap-1.5 shrink-0 pt-0.5">
							{!isExpanded && (
								<span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
									expand
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
				</div>
			</div>
		</div>
	);
}
