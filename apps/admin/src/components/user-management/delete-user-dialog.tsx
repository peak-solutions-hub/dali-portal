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
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface User {
	id: string;
	fullName: string;
	email: string;
	role: string;
	status: "active" | "invited";
}

interface DeleteUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: User;
}

export function DeleteUserDialog({
	open,
	onOpenChange,
	user,
}: DeleteUserDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		setIsDeleting(true);

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// TODO: Implement actual delete logic
		console.log("Deactivating user:", user.id);

		try {
			toast.success(`${user.fullName} has been deactivated`, {
				description: "User account has been successfully deactivated",
				duration: 3000,
			});
			onOpenChange(false);
		} catch (error) {
			console.error("Error deactivating user:", error);
			toast.error("Failed to deactivate user", {
				description: "Please try again later",
			});
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-125">
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
						Are you sure you want to deactivate this user account? This action
						will:
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					{/* User Info */}
					<div className="rounded-lg border border-[#e6e6e8] bg-[#f9f9fb] p-4 mb-4">
						<div className="flex flex-col gap-2">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-[#364153]">
									Full Name:
								</span>
								<span className="text-sm text-[#101828]">{user.fullName}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-[#364153]">
									Email:
								</span>
								<span className="text-sm text-[#101828]">{user.email}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-[#364153]">
									Role:
								</span>
								<span className="text-sm text-[#101828]">{user.role}</span>
							</div>
						</div>
					</div>

					{/* Warning List */}
					<ul className="space-y-2 text-sm text-[#4a5565]">
						<li className="flex items-start gap-2">
							<span className="text-[#a60202] mt-0.5">•</span>
							<span>Revoke the user's access to the system immediately</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-[#a60202] mt-0.5">•</span>
							<span>Remove them from Supabase authentication</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-[#a60202] mt-0.5">•</span>
							<span>
								Prevent them from logging in or accessing any resources
							</span>
						</li>
					</ul>

					<p className="mt-4 text-sm font-medium text-[#101828]">
						This action cannot be undone. The user will need to be re-invited if
						you want to restore their access.
					</p>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleDelete}
						disabled={isDeleting}
						className="bg-[#a60202] hover:bg-[#8a0101] text-white"
					>
						{isDeleting ? "Deactivating..." : "Deactivate User"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
