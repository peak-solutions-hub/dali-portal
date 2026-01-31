"use client";

import { passwordRequirements } from "@repo/shared";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { Check } from "@repo/ui/lib/lucide-react";
import { cn } from "@repo/ui/lib/utils"; // Assuming you have a cn utility

interface PasswordValidationTooltipProps {
	password: string;
	children: React.ReactNode;
	isOpen: boolean;
}

function PasswordRequirementItem({
	met,
	label,
}: {
	met: boolean;
	label: string;
}) {
	return (
		<div className="flex items-center gap-3 text-xs transition-all duration-300">
			<div
				className={cn(
					"w-4 h-4 rounded-full border flex items-center justify-center transition-colors duration-300",
					met
						? "bg-green-500 border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
						: "border-gray-600 bg-transparent",
				)}
			>
				{met && <Check className="w-3 h-3 text-white stroke-[3px]" />}
			</div>
			<span
				className={cn(
					"transition-colors duration-300",
					met ? "text-green-400 font-medium" : "text-gray-400",
				)}
			>
				{label}
			</span>
		</div>
	);
}

export function PasswordValidationTooltip({
	password,
	children,
	isOpen,
}: PasswordValidationTooltipProps) {
	const requirements = {
		minLength: password.length >= passwordRequirements.minLength,
		uppercase: passwordRequirements.patterns.uppercase.test(password),
		lowercase: passwordRequirements.patterns.lowercase.test(password),
		number: passwordRequirements.patterns.number.test(password),
		special: passwordRequirements.patterns.special.test(password),
	};

	return (
		<TooltipProvider>
			<Tooltip open={isOpen}>
				<TooltipTrigger asChild>{children}</TooltipTrigger>
				<TooltipContent
					side="right"
					align="start"
					sideOffset={15}
					className="w-72 p-4 bg-gray-950 border-gray-800 shadow-2xl z-50"
				>
					<div className="space-y-3">
						<p className="text-[11px] uppercase tracking-wider font-bold text-gray-500 mb-2">
							Security Requirements
						</p>
						<PasswordRequirementItem
							met={requirements.minLength}
							label="8+ characters"
						/>
						<PasswordRequirementItem
							met={requirements.uppercase}
							label="Uppercase letter (A-Z)"
						/>
						<PasswordRequirementItem
							met={requirements.lowercase}
							label="Lowercase letter (a-z)"
						/>
						<PasswordRequirementItem
							met={requirements.number}
							label="Number (0-9)"
						/>
						<PasswordRequirementItem
							met={requirements.special}
							label="Special character (!@#$%)"
						/>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
