"use client";

import { Button } from "@repo/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@repo/ui/components/sheet";
import { FileText } from "@repo/ui/lib/lucide-react";

interface SuccessDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	referenceNumber: string;
}

export function SuccessDialog({
	open,
	onOpenChange,
	referenceNumber,
}: SuccessDialogProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="bottom" className="mx-auto max-w-lg">
				<SheetHeader className="text-center space-y-6 py-8">
					<div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
						<FileText className="w-10 h-10" />
					</div>
					<div className="space-y-3">
						<SheetTitle className="text-3xl font-semibold text-gray-900">
							Inquiry Submitted!
						</SheetTitle>
						<SheetDescription className="text-base text-gray-600">
							Your inquiry has been successfully submitted. Please save your
							ticket ID for tracking.
						</SheetDescription>
					</div>
					<div className="bg-gradient-to-br from-red-50 to-amber-50 p-6 rounded-lg border border-red-100">
						<p className="text-sm text-gray-600 mb-2 font-medium">
							Your Ticket ID
						</p>
						<p className="text-2xl font-mono font-bold text-[#a60202] tracking-wider">
							{referenceNumber}
						</p>
					</div>
					<div className="pt-4">
						<Button
							onClick={() => onOpenChange(false)}
							className="bg-[#a60202] hover:bg-[#8b0202] w-full h-12"
						>
							Continue
						</Button>
					</div>
				</SheetHeader>
			</SheetContent>
		</Sheet>
	);
}
