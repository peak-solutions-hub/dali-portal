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
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

interface DeactivateUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: UserWithRole | null;
	onRefresh?: () => void;
}

export function DeactivateUserDialog({
	open,
	onOpenChange,
	user,
	onRefresh,
}: DeactivateUserDialogProps) {
	const [isDeactivating, setIsDeactivating] = useState(false);
	const router = useRouter();

	const handleUserDeactivation = async () => {
		if (!user) return;

		setIsDeactivating(true);

		try {
			const [error, result] = await api.users.deactivate({ id: user.id });

			if (error) {
				throw error;
			}

			if (result) {
				toast.success(`${user.fullName} has been deactivated`, {
					description: "User account has been successfully deactivated",
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
			console.error("Error deactivating user:", error);
			toast.error("Failed to deactivate user", {
				description:
					error instanceof Error ? error.message : "Please try again later",
			});
		} finally {
			setIsDeactivating(false);
		}
	};

	if (!user) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-125 max-h-[80vh] overflow-auto">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
							<AlertTriangle className="h-5 w-5 text-[#a60202]" />
						</div>
						<div>
							<DialogTitle>Deactivate User Account</DialogTitle>
						</div>
					</div>
					<DialogDescription className="pt-3">
						Are you sure you want to deactivate this user account? This will set
						their status to "Deactivated" and:
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

					{/* Warning List */}
					<ul className="space-y-2 text-sm text-[#4a5565]">
						<li className="flex items-start gap-2">
							<span className="text-[#a60202] mt-0.5">•</span>
							<span>Mark the user account as deactivated in the system</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-[#a60202] mt-0.5">•</span>
							<span>
								Prevent them from logging in or accessing any resources
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-[#a60202] mt-0.5">•</span>
							<span>
								The user data will remain in the database for audit purposes
							</span>
						</li>
					</ul>

					<p className="mt-4 text-sm font-medium text-[#101828]">
						The user will appear at the bottom of the user list with a
						"Deactivated" status. An IT Administrator can reactivate the account
						if needed.
					</p>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isDeactivating}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleUserDeactivation}
						disabled={isDeactivating}
						className="bg-[#a60202] hover:bg-[#8a0101] text-white"
					>
						{isDeactivating ? "Deactivating..." : "Deactivate User"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
