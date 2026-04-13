"use client";

import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Loader2 } from "@repo/ui/lib/lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAssignInvitationToCallerSlip } from "@/hooks/caller-slips/use-caller-slip-mutations";
import { orpc } from "@/lib/api.client";

interface AssignInvitationToCallerSlipDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAssigned?: () => void;
	invitationDocumentId: string;
	invitationTitle: string;
	invitationCodeNumber: string;
}

export function AssignInvitationToCallerSlipDialog({
	open,
	onOpenChange,
	onAssigned,
	invitationDocumentId,
	invitationTitle,
	invitationCodeNumber,
}: AssignInvitationToCallerSlipDialogProps) {
	const router = useRouter();
	const [selectedSlipId, setSelectedSlipId] = useState<string>("");
	const assignMutation = useAssignInvitationToCallerSlip();

	const listQuery = useQuery({
		...orpc.callerSlips.getList.queryOptions({
			input: {
				status: "pending",
				page: 1,
				limit: 100,
			},
		}),
		enabled: open,
	});

	const pendingSlips = useMemo(
		() => listQuery.data?.items ?? [],
		[listQuery.data],
	);

	useEffect(() => {
		if (!open) {
			setSelectedSlipId("");
		}
	}, [open]);

	const selectedSlip = useMemo(
		() => pendingSlips.find((item) => item.id === selectedSlipId) ?? null,
		[pendingSlips, selectedSlipId],
	);

	const errorMessage = useMemo(() => {
		const mutationError = assignMutation.error;
		if (!mutationError) {
			return null;
		}
		if (mutationError instanceof Error) {
			return mutationError.message;
		}
		return "Failed to assign invitation to caller's slip";
	}, [assignMutation.error]);

	const handleAssign = async () => {
		if (!selectedSlipId) {
			return;
		}

		try {
			const result = await assignMutation.mutateAsync({
				slipId: selectedSlipId,
				invitationDocumentId,
			});

			onOpenChange(false);
			onAssigned?.();
			router.push(`/caller-slips/${result.slipId}`);
		} catch {
			// Error surfaced in dialog.
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (assignMutation.isPending) {
					return;
				}
				onOpenChange(nextOpen);
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Assign to Existing Caller&apos;s Slip</DialogTitle>
					<DialogDescription>
						Select an active caller&apos;s slip to attach this invitation.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3 py-2">
					<div className="rounded-md border p-3 text-sm">
						<p className="font-medium">{invitationTitle}</p>
						<p className="text-xs text-muted-foreground">
							{invitationCodeNumber}
						</p>
					</div>

					{listQuery.isLoading ? (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" />
							<span>Loading caller slips...</span>
						</div>
					) : pendingSlips.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No pending caller slips available. Generate a new caller&apos;s
							slip instead.
						</p>
					) : (
						<div className="space-y-2">
							<Select
								value={selectedSlipId}
								onValueChange={setSelectedSlipId}
								disabled={assignMutation.isPending}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a pending caller's slip" />
								</SelectTrigger>
								<SelectContent>
									{pendingSlips.map((slip) => (
										<SelectItem key={slip.id} value={slip.id}>
											{slip.name} ({slip.invitationCount} invitation
											{slip.invitationCount === 1 ? "" : "s"})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{selectedSlip ? (
								<p className="text-xs text-muted-foreground">
									This invitation will be added to {selectedSlip.name}.
								</p>
							) : null}
						</div>
					)}

					{errorMessage ? (
						<p className="text-sm text-destructive">{errorMessage}</p>
					) : null}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={assignMutation.isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={handleAssign}
						disabled={
							assignMutation.isPending ||
							pendingSlips.length === 0 ||
							!selectedSlipId
						}
					>
						{assignMutation.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : null}
						Assign Invitation
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
