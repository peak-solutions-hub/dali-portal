"use client";

import type { Role } from "@repo/shared";
import {
	formatRoleDisplay,
	getRoleBadgeStyles,
	TEXT_LIMITS,
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
	const [roleId, setRoleId] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [roles, setRoles] = useState<Role[]>([]);
	const [isLoadingRoles, setIsLoadingRoles] = useState(true);
	const router = useRouter();

	useEffect(() => {
		async function fetchRoles() {
			try {
				const [error, result] = await api.roles.list();
				if (error) {
					throw error;
				}
				if (result?.roles) {
					setRoles(result.roles as unknown as Role[]);
				}
			} catch (error) {
				console.error("Failed to load roles:", error);
				toast.error("Failed to load roles");
			} finally {
				setIsLoadingRoles(false);
			}
		}
		if (open) {
			fetchRoles();
		}
	}, [open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const [error, data] = await api.users.invite({
				email,
				fullName,
				roleId,
			});

			if (error) {
				throw error;
			}

			if (data) {
				toast.success(`Invitation sent to ${fullName}`, {
					description:
						data.message || `An email invitation has been sent to ${email}`,
					duration: 5000,
				});

				// Close dialog first
				handleCancel();

				// Then refresh to show the new user (with small delay to ensure dialog closes)
				setTimeout(() => {
					router.refresh();
				}, 1000);
			}
		} catch (error) {
			console.error("Error sending invitation:", error);
			toast.error("Failed to send invitation", {
				description:
					error instanceof Error ? error.message : "Please try again later",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCancel = () => {
		setFullName("");
		setEmail("");
		setRoleId("");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-125">
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
							<Label htmlFor="fullName">
								Full Name <span className="text-red-500">*</span>
							</Label>
							<Input
								id="fullName"
								placeholder={`Enter full name (min 5, max ${TEXT_LIMITS.XS} chars)`}
								value={fullName}
								onChange={(e) => {
									setFullName(e.target.value);
								}}
								maxLength={TEXT_LIMITS.XS}
								required
								className="bg-white focus:ring-[#a60202] border-[#d0d5dd] focus:border-[#a60202]"
							/>
							<p className="text-xs text-[#6b7280]">
								{fullName.length}/{TEXT_LIMITS.XS} characters
							</p>
						</div>

						{/* Email Input */}
						<div className="flex flex-col gap-2">
							<Label htmlFor="email">
								Email Address <span className="text-red-500">*</span>
							</Label>
							<Input
								id="email"
								type="email"
								placeholder={`user@iloilo.gov.ph (max ${TEXT_LIMITS.SM} chars)`}
								value={email}
								onChange={(e) => {
									setEmail(e.target.value);
								}}
								maxLength={TEXT_LIMITS.SM}
								required
								className="bg-white focus:ring-[#a60202] border-[#d0d5dd] focus:border-[#a60202]"
							/>
							<p className="text-xs text-[#6b7280]">
								{email.length}/{TEXT_LIMITS.SM} characters
							</p>
						</div>

						{/* Role Select */}
						<div className="flex flex-col gap-2">
							<Label htmlFor="role">
								Role <span className="text-red-500">*</span>
							</Label>
							<Select value={roleId} onValueChange={setRoleId} required>
								<SelectTrigger id="role">
									<SelectValue
										placeholder={
											isLoadingRoles ? "Loading roles..." : "Select a role"
										}
									/>
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
								!email ||
								!roleId ||
								isLoadingRoles ||
								fullName.length < 10 ||
								fullName.length > 50 ||
								email.length > 255
							}
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
