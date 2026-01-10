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
import { useState } from "react";

interface InviteUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({
	open,
	onOpenChange,
}: InviteUserDialogProps) {
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [role, setRole] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

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

		// TODO: Implement actual invite logic
		console.log("Inviting user:", { fullName, email, role });

		// Reset form and close dialog
		setFullName("");
		setEmail("");
		setRole("");
		setIsSubmitting(false);
		onOpenChange(false);
	};

	const handleCancel = () => {
		setFullName("");
		setEmail("");
		setRole("");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Invite New User</DialogTitle>
					<DialogDescription>
						Send an invitation email to a new staff member. They will receive a
						secure activation link to set up their account.
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

						{/* Email Input */}
						<div className="flex flex-col gap-2">
							<Label htmlFor="email">Email Address</Label>
							<Input
								id="email"
								type="email"
								placeholder="user@iloilo.gov.ph"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>

						{/* Role Select */}
						<div className="flex flex-col gap-2">
							<Label htmlFor="role">Role</Label>
							<Select value={role} onValueChange={setRole} required>
								<SelectTrigger id="role">
									<SelectValue placeholder="Select a role" />
								</SelectTrigger>
								<SelectContent>
									{roles.map((roleName) => (
										<SelectItem key={roleName} value={roleName}>
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
							disabled={isSubmitting || !fullName || !email || !role}
							className="bg-[#a60202] hover:bg-[#8a0101] text-white"
						>
							{isSubmitting ? "Sending..." : "Send Invitation"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
