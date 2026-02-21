"use client";

import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { AlertCircle } from "@repo/ui/lib/lucide-react";

interface CaptchaErrorModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	errorMessage: string;
}

/**
 * Modal dialog for displaying captcha validation errors.
 * Used when security check fails or expires.
 */
export function CaptchaErrorModal({
	open,
	onOpenChange,
	errorMessage,
}: CaptchaErrorModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-2">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
							<AlertCircle className="h-6 w-6 text-red-600" />
						</div>
						<DialogTitle className="text-lg sm:text-xl font-semibold text-red-900 text-center sm:text-left">
							Security Check Failed
						</DialogTitle>
					</div>
					<DialogDescription className="text-sm sm:text-base text-gray-700 leading-relaxed pt-2">
						{errorMessage}
					</DialogDescription>
				</DialogHeader>
				<div className="flex justify-center sm:justify-end mt-4">
					<Button
						onClick={() => onOpenChange(false)}
						className="w-full sm:w-auto bg-[#a60202] hover:bg-[#8d0202] text-white"
					>
						Got it
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
