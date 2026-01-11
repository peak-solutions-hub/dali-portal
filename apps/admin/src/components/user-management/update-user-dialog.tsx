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
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface User {
	id: string;
	fullName: string;
	email: string;
	role: string;
	status: "active" | "invited";
}

interface UpdateUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: User;
}

export function UpdateUserDialog({
	open,
	onOpenChange,
	user,
}: UpdateUserDialogProps) {
	const [fullName, setFullName] = useState(user.fullName);
	const [role, setRole] = useState(user.role);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Update local state when user prop changes
	useEffect(() => {
		setFullName(user.fullName);
		setRole(user.role);
	}, [user]);

	const roles = [
		"Administrator",
		"Administrative Office Clerk",
		"Administrative Office Department Head",
		"City Councilor",
		"Information Systems Analyst",
		"Secretariat",
		"Vice Mayor",
		"Vice Mayor Office Staff",
	];

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// TODO: Implement actual update logic
		console.log("Updating user:", { id: user.id, fullName, role });

		try {
			// Success toast
			toast.success(`${fullName} updated successfully`, {
				description: "User details have been saved",
				duration: 3000,
			});
			onOpenChange(false);
		} catch (error) {
			console.error("Error updating user:", error);
			toast.error("Failed to update user", {
				description: "Please try again later",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		// Reset to original values
		setFullName(user.fullName);
		setRole(user.role);
		onOpenChange(false);
	};

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
							<Label htmlFor="fullName">Full Name</Label>
							<Input
								id="fullName"
								placeholder="Enter full name"
								value={fullName}
								onChange={(e) => setFullName(e.target.value)}
								required
							/>
						</div>

						{/* Email (Read-only) */}
						<div className="flex flex-col gap-2">
							<Label htmlFor="email">Email Address</Label>
							<Input
								id="email"
								type="email"
								value={user.email}
								disabled
								className="bg-[#f3f3f5] cursor-not-allowed"
							/>
							<p className="text-xs text-[#4a5565]">
								Email cannot be changed after account creation
							</p>
						</div>

						{/* Role Select */}
						<div className="flex flex-col gap-2">
							<Label htmlFor="role">Role</Label>
							<Select value={role} onValueChange={setRole} required>
								<SelectTrigger id="role">
									<SelectValue placeholder="Select a role" />
								</SelectTrigger>
								<SelectContent
									position="popper"
									side="bottom"
									align="start"
									sideOffset={4}
								>
									{roles.map((roleName) => (
										<SelectItem
											key={roleName}
											value={roleName}
											className="hover:bg-gray-100 cursor-pointer"
										>
											{roleName}
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
							disabled={isSubmitting || !fullName || !role}
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
