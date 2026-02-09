"use client";

import type { UserWithRole } from "@repo/shared";
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

interface ActivateUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: UserWithRole | null;
	onRefresh?: () => void;
}

export function ActivateUserDialog({
	open,
	onOpenChange,
	user,
	onRefresh,
}: ActivateUserDialogProps) {
	const [isActivating, setIsActivating] = useState(false);
	const router = useRouter();

	const handleUserActivation = async () => {
		if (!user) return;

		setIsActivating(true);

		try {
			// Reuse the activation API which now handles deactivated users too
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
			console.error("Error activating user:", error);
			toast.error("Failed to activate user", {
				description:
					error instanceof Error ? error.message : "Please try again later",
			});
		} finally {
			setIsActivating(false);
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
						Are you sure you want to reactivate this user account?
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					<p className="text-sm text-[#4a5565] mb-4">
						This will restore access for <strong>{user.fullName}</strong> (
						{user.email}). They will be able to log in again.
					</p>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isActivating}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleUserActivation}
							disabled={isActivating}
							className="bg-green-600 hover:bg-green-700 text-white"
						>
							{isActivating ? "Reactivating..." : "Reactivate User"}
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
}
