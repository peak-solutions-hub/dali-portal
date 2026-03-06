import type {
	InquiryTicketWithMessagesResponse,
	UserWithRole,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { CheckCircle, UserCheck, XCircle } from "lucide-react";

interface InquiryTicketActionsProps {
	ticket: InquiryTicketWithMessagesResponse;
	/** Called when the Resolve button is clicked (opens confirmation dialog) */
	onResolve: () => void;
	/** Called when the Reject button is clicked (opens confirmation dialog) */
	onReject: () => void;
	/** Called with a user ID to assign, or null to unassign */
	onAssignTo: (userId: string | null) => void;
	/** Whether a status update (resolve/reject) is in progress */
	isUpdating: boolean;
	/** Whether an assignment is in progress */
	isAssigningTo: boolean;
	currentUserId?: string;
	staffList: UserWithRole[];
	isLoadingStaff: boolean;
}

const UNASSIGNED_VALUE = "__unassigned__";

export function InquiryTicketActions({
	ticket,
	onResolve,
	onReject,
	onAssignTo,
	isUpdating,
	isAssigningTo,
	currentUserId,
	staffList,
	isLoadingStaff,
}: InquiryTicketActionsProps) {
	const isClosed = ticket.status === "resolved" || ticket.status === "rejected";

	if (isClosed) return null;

	const currentValue = ticket.assignedTo ?? UNASSIGNED_VALUE;
	const isDisabled = isUpdating || isAssigningTo || isLoadingStaff;

	return (
		<div className="space-y-3 px-6 pb-6 pt-2">
			<p className="text-xs font-medium text-muted-foreground">Actions</p>
			<div className="flex items-center gap-2">
				{/* Assignee selector — takes remaining space */}
				<div className="flex-1">
					<Select
						value={currentValue}
						onValueChange={(value) => {
							onAssignTo(value === UNASSIGNED_VALUE ? null : value);
						}}
						disabled={isDisabled}
					>
						<SelectTrigger className="h-8 text-xs w-full border-zinc-300 hover:border-zinc-400 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500 [&_svg:last-child]:rotate-180">
							<div className="flex items-center gap-2 min-w-0">
								{ticket.assignedTo ? (
									<UserCheck className="h-4 w-4 shrink-0 text-primary" />
								) : (
									<UserCheck className="h-4 w-4 shrink-0 text-muted-foreground/50" />
								)}
								<SelectValue placeholder="Unassigned" />
							</div>
						</SelectTrigger>
						<SelectContent
							position="popper"
							side="top"
							sideOffset={4}
							className="w-[var(--radix-select-trigger-width)] max-h-none"
						>
							<SelectItem value={UNASSIGNED_VALUE}>
								<span className="text-muted-foreground">Unassigned</span>
							</SelectItem>
							{staffList.map((user) => (
								<SelectItem key={user.id} value={user.id}>
									{user.id === currentUserId
										? `${user.fullName} (You)`
										: user.fullName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Resolve */}
				<Button
					variant="outline"
					size="sm"
					onClick={onResolve}
					disabled={isUpdating || !ticket.assignedTo}
					className="flex items-center justify-center gap-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 disabled:opacity-50 disabled:border-green-600/50 disabled:text-green-600/50 shrink-0"
				>
					<CheckCircle className="h-4 w-4" />
					Resolve
				</Button>

				{/* Reject */}
				<Button
					variant="outline"
					size="sm"
					onClick={onReject}
					disabled={isUpdating}
					className="flex items-center justify-center gap-2 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700 disabled:opacity-50 disabled:border-red-600/50 disabled:text-red-600/50 shrink-0"
				>
					<XCircle className="h-4 w-4" />
					Reject
				</Button>
			</div>
		</div>
	);
}
