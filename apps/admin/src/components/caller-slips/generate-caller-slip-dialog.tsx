"use client";

import type { DocumentListItem } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Loader2 } from "@repo/ui/lib/lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGenerateCallerSlip } from "@/hooks/caller-slips/use-caller-slip-mutations";
import { useDocumentStore } from "@/stores/document-store";

interface GenerateCallerSlipDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedDocuments: DocumentListItem[];
}

export function GenerateCallerSlipDialog({
	open,
	onOpenChange,
	selectedDocuments,
}: GenerateCallerSlipDialogProps) {
	const router = useRouter();
	const { clearInvitationSelection } = useDocumentStore();
	const generateMutation = useGenerateCallerSlip();

	// Auto-suggest name based on earliest receivedAt
	const sortedDocs = [...selectedDocuments].sort(
		(a, b) =>
			new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime(),
	);
	const earliestDate = sortedDocs[0]?.receivedAt
		? new Date(sortedDocs[0].receivedAt).toLocaleDateString("en-PH", {
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: new Date().toLocaleDateString("en-PH", {
				year: "numeric",
				month: "long",
				day: "numeric",
			});
	const defaultName = `Caller's Slip — ${earliestDate}`;

	const [name, setName] = useState(defaultName);

	const handleGenerate = async () => {
		try {
			const result = await generateMutation.mutateAsync({
				name: name.trim(),
				invitationDocumentIds: selectedDocuments.map((d) => d.id),
			});
			clearInvitationSelection();
			onOpenChange(false);
			router.push(`/caller-slips/${result.id}`);
		} catch {
			// Error handling is done by the mutation
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Generate Caller&apos;s Slip</DialogTitle>
					<DialogDescription>
						Create a caller&apos;s slip from {selectedDocuments.length} selected
						invitation{selectedDocuments.length > 1 ? "s" : ""}.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<Label htmlFor="slip-name">Slip Name</Label>
						<Input
							id="slip-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Enter a name for this caller's slip"
						/>
					</div>

					<div className="space-y-2">
						<Label>Selected Invitations</Label>
						<div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
							{selectedDocuments.map((doc) => (
								<div
									key={doc.id}
									className="flex items-center justify-between gap-2 text-sm"
								>
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium">{doc.title}</p>
										<p className="text-xs text-muted-foreground">
											{doc.codeNumber} •{" "}
											{new Date(doc.receivedAt).toLocaleDateString("en-PH", {
												month: "short",
												day: "numeric",
												year: "numeric",
											})}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{generateMutation.error && (
						<p className="text-sm text-destructive">
							{generateMutation.error instanceof Error
								? generateMutation.error.message
								: "Failed to generate caller's slip"}
						</p>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={generateMutation.isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={handleGenerate}
						disabled={!name.trim() || generateMutation.isPending}
					>
						{generateMutation.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Generate Slip
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
