import { Button } from "@repo/ui/components/button";
import { CheckCircle, UserPlus, XCircle } from "lucide-react";

interface InquiryTicketActionsProps {
	onAssign: () => void;
	onResolve: () => void;
	onReject: () => void;
	isUpdating: boolean;
}

export function InquiryTicketActions({
	onAssign,
	onResolve,
	onReject,
	isUpdating,
}: InquiryTicketActionsProps) {
	return (
		<div className="space-y-3 mt-6">
			<p className="text-sm font-medium text-muted-foreground">Actions</p>
			<div className="grid grid-cols-3 gap-2">
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
				<Button
					variant="outline"
					size="sm"
					onClick={onResolve}
					disabled={isUpdating}
					className="flex items-center justify-center gap-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700"
				>
					<CheckCircle className="h-4 w-4" />
					Resolve
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={onReject}
					disabled={isUpdating}
					className="flex items-center justify-center gap-2 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700"
				>
					<XCircle className="h-4 w-4" />
					Reject
				</Button>
			</div>
		</div>
	);
}
