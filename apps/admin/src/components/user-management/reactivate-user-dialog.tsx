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
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

interface ReactivateUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: UserWithRole | null;
	onRefresh?: () => void;
}

export function ReactivateUserDialog({
	open,
	onOpenChange,
	user,
	onRefresh,
}: ReactivateUserDialogProps) {
	const [isReactivating, setIsReactivating] = useState(false);
	const router = useRouter();

	const handleUserReactivation = async () => {
		if (!user) return;

		setIsReactivating(true);

		try {
			const [error, result] = await api.users.activate({ id: user.id });

			if (error) {
				throw error;
			}

			if (result) {
				toast.success(`${user.fullName} has been reactivated`, {
					description: "User account has been successfully reactivated",
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
			console.error("Error reactivating user:", error);
			toast.error("Failed to reactivate user", {
				description:
					error instanceof Error ? error.message : "Please try again later",
			});
		} finally {
			setIsReactivating(false);
		}
	};

	if (!user) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-125 max-h-[80vh] overflow-auto">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
							<CheckCircle className="h-5 w-5 text-green-600" />
						</div>
						<div>
							<DialogTitle>Reactivate User Account</DialogTitle>
						</div>
					</div>
					<DialogDescription className="pt-3">
						Are you sure you want to reactivate this user account? This will
						restore access and:
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

					{/* Benefits List */}
					<ul className="space-y-2 text-sm text-[#4a5565]">
						<li className="flex items-start gap-2">
							<span className="text-green-600 mt-0.5">•</span>
							<span>Mark the user account as active in the system</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-green-600 mt-0.5">•</span>
							<span>Allow them to log in and access resources</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-green-600 mt-0.5">•</span>
							<span>Restore their role and permissions</span>
						</li>
					</ul>

					<p className="mt-4 text-sm font-medium text-[#101828]">
						The user will appear in the active users list with an "Active"
						status and will be able to access the system immediately.
					</p>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isReactivating}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleUserReactivation}
						disabled={isReactivating}
						className="bg-green-600 hover:bg-green-700 text-white"
					>
						{isReactivating ? "Reactivating..." : "Reactivate User"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
