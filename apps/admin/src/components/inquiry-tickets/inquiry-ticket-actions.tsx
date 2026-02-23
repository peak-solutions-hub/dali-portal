import type { InquiryTicketWithMessagesResponse } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { CheckCircle, User, UserCheck, UserPlus, XCircle } from "lucide-react";

interface InquiryTicketActionsProps {
	ticket: InquiryTicketWithMessagesResponse;
	onAssign: () => void;
	onResolve: () => void;
	onReject: () => void;
	isUpdating: boolean;
	currentUserId?: string;
}

export function InquiryTicketActions({
	ticket,
	onAssign,
	onResolve,
	onReject,
	isUpdating,
	currentUserId,
}: InquiryTicketActionsProps) {
	const isAssigned = !!ticket.user;
	const isAssignedToCurrentUser = ticket.assignedTo === currentUserId;
	const isClosed = ticket.status === "resolved" || ticket.status === "rejected";

	if (isClosed) return null;

	return (
		<div className="space-y-3 px-6 pb-6 pt-4">
			<p className="text-sm font-medium text-muted-foreground">Actions</p>
			<div className="grid grid-cols-3 gap-2">
				{isAssigned ? (
					<div className="flex items-center gap-2 px-3 text-sm bg-muted/50 rounded-md h-9">
						<span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium whitespace-nowrap">
							Assigned to:
						</span>
						<div className="flex items-center gap-1.5">
							<span className="text-xs font-medium text-foreground/80 truncate">
								{isAssignedToCurrentUser ? "you" : ticket.user?.fullName}
							</span>
							<UserCheck className="h-3.5 w-3.5 text-muted-foreground/70" />
						</div>
					</div>
				) : (
					<Button
						variant="outline"
						size="sm"
						onClick={onAssign}
						disabled={isUpdating}
						className="flex items-center justify-center gap-2"
					>
						<UserPlus className="h-4 w-4" />
						Assign to Me
					</Button>
				)}
				<Button
					variant="outline"
					size="sm"
					onClick={onResolve}
					disabled={isUpdating || !isAssigned}
					className="flex items-center justify-center gap-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 disabled:opacity-50 disabled:border-green-600/50 disabled:text-green-600/50"
				>
					<CheckCircle className="h-4 w-4" />
					Resolve
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={onReject}
					disabled={isUpdating}
					className="flex items-center justify-center gap-2 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700 disabled:opacity-50 disabled:border-red-600/50 disabled:text-red-600/50"
				>
					<XCircle className="h-4 w-4" />
					Reject
				</Button>
			</div>
		</div>
	);
}
