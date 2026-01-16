"use client";

import type { Role, UserWithRole } from "@repo/shared";
import { formatRoleDisplay, getRoleBadgeStyles } from "@repo/shared";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api.client";

interface UpdateUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: UserWithRole | null;
	roles: Role[];
}

export function UpdateUserDialog({
	open,
	onOpenChange,
	user,
	roles,
}: UpdateUserDialogProps) {
	const [fullName, setFullName] = useState(user?.fullName || "");
	const [roleId, setRoleId] = useState(user?.roleId || "");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();

	// Update local state when user prop changes
	useEffect(() => {
		if (user) {
			setFullName(user.fullName);
			setRoleId(user.roleId);
		}
	}, [user]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;

		// Check if there are any changes
		const hasChanges =
			fullName.trim() !== user.fullName || roleId !== user.roleId;

		if (!hasChanges) {
			// No changes detected, just close the modal
			onOpenChange(false);
			return;
		}

		setIsSubmitting(true);

		try {
			const data = await api.users.update({
				id: user.id,
				fullName: fullName.trim(),
				roleId: roleId,
			});

			if (data) {
				toast.success(`${fullName} updated successfully`, {
					description: "User details have been saved",
					duration: 3000,
				});
				onOpenChange(false);

				// Refresh the page to show updated data
				setTimeout(() => {
					router.refresh();
				}, 1000);
			}
		} catch (error) {
			console.error("Error updating user:", error);
			toast.error("Failed to update user", {
				description:
					error instanceof Error ? error.message : "Please try again later",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		if (user) {
			setFullName(user.fullName);
			setRoleId(user.roleId);
		}
		onOpenChange(false);
	};

	if (!user) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-125">
				<DialogHeader>
					<DialogTitle>Update User Details</DialogTitle>
					<DialogDescription>
						Edit the user's name or update their role. Changes will take effect
						immediately.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="flex flex-col gap-4 py-4">
						{/* Full Name Input */}
						<div className="flex flex-col gap-2">
							<Label htmlFor="fullName">
								Full Name <span className="text-red-500">*</span>
							</Label>
							<Input
								id="fullName"
								placeholder="Enter full name (min 10, max 50 chars)"
								value={fullName}
								onChange={(e) => {
									const value = e.target.value.slice(0, 75);
									setFullName(value);
								}}
								maxLength={75}
								required
								className={`bg-white focus:ring-[#a60202] ${
									fullName.length > 50
										? "border-red-500 focus:border-red-500"
										: "border-[#d0d5dd] focus:border-[#a60202]"
								}`}
							/>
							{fullName.length > 50 ? (
								<p className="text-xs text-red-600 font-medium">
									Name exceeds 50 characters! Please shorten it.
								</p>
							) : null}
							<p
								className={`text-xs ${
									fullName.length > 50
										? "text-red-600 font-medium"
										: "text-[#6b7280]"
								}`}
							>
								{fullName.length}/50 characters
							</p>
						</div>

						{/* Email (Read-only) */}
						<div className="flex flex-col gap-2">
							<Label htmlFor="email">Email Address</Label>
							<Input
								id="email"
								type="email"
								value={user.email}
								disabled
								className="bg-[#f3f3f5] cursor-not-allowed border-[#d0d5dd]"
							/>
							<p className="text-xs text-[#4a5565]">
								Email cannot be changed after account creation
							</p>
						</div>

						{/* Role Select */}
						<div className="flex flex-col gap-2">
							<Label htmlFor="role">
								Role <span className="text-red-500">*</span>
							</Label>
							<Select value={roleId} onValueChange={setRoleId} required>
								<SelectTrigger
									id="role"
									className="bg-white border-[#d0d5dd] focus:border-[#a60202] focus:ring-[#a60202]"
								>
									<SelectValue placeholder="Select a role" />
								</SelectTrigger>
								<SelectContent
									position="popper"
									side="bottom"
									align="start"
									sideOffset={4}
								>
									{roles.map((role) => (
										<SelectItem
											key={role.id}
											value={role.id}
											className="hover:bg-gray-100 cursor-pointer"
										>
											<span
												className={`inline-block px-2 py-0.5 text-xs rounded-md ${getRoleBadgeStyles()}`}
											>
												{formatRoleDisplay(role.name)}
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={
								isSubmitting ||
								!fullName ||
								!roleId ||
								fullName.length < 5 ||
								fullName.length > 50
							}
							className="bg-[#a60202] hover:bg-[#8a0101] text-white"
						>
							{isSubmitting ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
