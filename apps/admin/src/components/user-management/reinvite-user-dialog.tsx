"use client";

import type { UserWithRole } from "@repo/shared";
import {
	formatRoleDisplay,
	getRoleBadgeStyles,
	truncateEmail,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

interface ReinviteUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: UserWithRole | null;
	onRefresh?: () => void;
}

export function ReinviteUserDialog({
	open,
	onOpenChange,
	user,
	onRefresh,
}: ReinviteUserDialogProps) {
	const [isReinviting, setIsReinviting] = useState(false);
	const router = useRouter();

	const handleReinvite = async () => {
		if (!user) return;

		setIsReinviting(true);

		try {
			const [error, result] = await api.users.invite({
				email: user.email,
				fullName: user.fullName,
				roleId: user.role.id,
			});

			if (error) {
				throw error;
			}

			if (result) {
				toast.success(`Invitation sent to ${user.fullName}`, {
					description: "The invitation email has been sent successfully",
					duration: 3000,
				});
				onOpenChange(false);
				if (onRefresh) {
					onRefresh();
				} else {
					setTimeout(() => {
						router.refresh();
					}, 1000);
				}
			}
		} catch (error) {
			console.error("Error sending invitation:", error);
			toast.error("Failed to send invitation", {
				description:
					error instanceof Error ? error.message : "Please try again later",
			});
		} finally {
			setIsReinviting(false);
		}
	};

	if (!user) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-125 max-h-[80vh] overflow-auto">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
							<Mail className="h-5 w-5 text-blue-600" />
						</div>
						<div>
							<DialogTitle>Resend Invitation Email</DialogTitle>
						</div>
					</div>
					<DialogDescription className="pt-3">
						Are you sure you want to resend the invitation email to this user?
						This will send a new invitation email to:
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					{/* User Info */}
					<div className="rounded-lg border border-[#e6e6e8] bg-[#f9f9fb] p-4 mb-4 wrap-word-break">
						<div className="flex flex-col gap-2 text-wrap">
							<div className="grid grid-cols-2 gap-4 items-start">
								<span className="text-sm font-medium text-[#364153]">
									Full Name:
								</span>
								<span
									className="text-sm text-[#101828] wrap-word-break max-w-full"
									title={user.fullName}
								>
									{user.fullName}
								</span>
							</div>
							<div className="grid grid-cols-2 gap-4 items-start">
								<span className="text-sm font-medium text-[#364153]">
									Email:
								</span>
								<span
									className="text-sm text-[#101828] wrap-word-break max-w-full"
									title={user.email}
								>
									{truncateEmail(user.email, 15)}
								</span>
							</div>
							<div className="grid grid-cols-2 gap-4 items-start">
								<span className="text-sm font-medium text-[#364153]">
									Role:
								</span>
								<span
									className={`text-xs px-2 py-0.5 rounded-md ${getRoleBadgeStyles()}`}
								>
									{formatRoleDisplay(user.role.name)}
								</span>
							</div>
						</div>
					</div>

					{/* Info List */}
					<ul className="space-y-2 text-sm text-[#4a5565]">
						<li className="flex items-start gap-2">
							<span className="text-blue-600 mt-0.5">•</span>
							<span>A new invitation email with a setup link will be sent</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-blue-600 mt-0.5">•</span>
							<span>
								The user will receive instructions to set up their account
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-blue-600 mt-0.5">•</span>
							<span>
								Any previous invitation links will remain valid until used or
								expired
							</span>
						</li>
					</ul>

					<p className="mt-4 text-sm font-medium text-[#101828]">
						The user will remain in "Invited" status until they complete the
						account setup process.
					</p>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isReinviting}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleReinvite}
						disabled={isReinviting}
						className="bg-blue-600 hover:bg-blue-700 text-white"
					>
						{isReinviting ? "Sending..." : "Send Invitation"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
