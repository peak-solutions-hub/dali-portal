"use client";

import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { CheckCircle2, Copy, Mail, Printer } from "lucide-react";
import { useState } from "react";

interface SuccessDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	referenceNumber: string;
	citizenEmail: string;
}

export function SuccessDialog({
	open,
	onOpenChange,
	referenceNumber,
	citizenEmail,
}: SuccessDialogProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(referenceNumber);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handlePrint = () => {
		const printWindow = window.open("", "_blank");
		if (!printWindow) return;

		printWindow.document.write(`
      <html>
        <head>
          <title>Inquiry Reference - ${referenceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; text-align: center; color: #333; }
            .header { margin-bottom: 30px; border-bottom: 2px solid #a60202; padding-bottom: 20px; }
            .logo-text { font-size: 24px; font-weight: bold; color: #a60202; margin-bottom: 5px; }
            .subtitle { font-size: 16px; color: #666; }
            .reference-box { background-color: #f9f9f9; border: 2px dashed #ccc; padding: 30px; border-radius: 10px; margin: 30px 0; }
            .label { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 15px; font-weight: bold; }
            .reference-number { font-size: 42px; font-family: monospace; color: #a60202; font-weight: bold; }
            .instructions { font-size: 14px; line-height: 1.6; color: #555; text-align: left; background: #fff5f5; padding: 20px; border-radius: 8px; }
            .footer { margin-top: 40px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-text">Office of the Vice Mayor</div>
            <div class="subtitle">Iloilo City</div>
          </div>
          <h2>Inquiry Receipt</h2>
          <p>Thank you for submitting your inquiry.</p>
          <div class="reference-box">
            <div class="label">Your Ticket Reference Number</div>
            <div class="reference-number">${referenceNumber}</div>
          </div>
          <div class="instructions">
            <strong>How to track your inquiry:</strong><br/>
            1. Visit the portal website<br/>
            2. Go to "Track Inquiry"<br/>
            3. Enter this reference number and your email address
          </div>
          <div class="footer">
            Date Printed: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}<br/>
            Please keep this document for your records.
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
		printWindow.document.close();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
				<DialogTitle className="sr-only">
					Inquiry Submitted Successfully
				</DialogTitle>
				{/* Brand header strip */}
				<div className="bg-[#a60202] px-6 py-5 text-center">
					<div className="mx-auto w-14 h-14 bg-white/15 rounded-full flex items-center justify-center mb-3">
						<CheckCircle2 className="w-8 h-8 text-white" />
					</div>
					<h2 className="text-xl font-bold text-white">Inquiry Submitted</h2>
					<p className="text-white/80 text-sm mt-1">
						Thank you! We&apos;ll review your inquiry shortly.
					</p>
				</div>

				{/* Content */}
				<div className="px-6 py-5 space-y-4">
					{/* Reference Number */}
					<div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
						<div className="flex items-center justify-between mb-2">
							<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
								Reference Number
							</span>
							<button
								type="button"
								onClick={handleCopy}
								className="text-xs text-gray-500 hover:text-[#a60202] flex items-center gap-1 transition-colors cursor-pointer"
							>
								{copied ? (
									<>
										<CheckCircle2 className="w-3 h-3 text-green-600" />
										<span className="text-green-600">Copied!</span>
									</>
								) : (
									<>
										<Copy className="w-3 h-3" />
										Copy
									</>
								)}
							</button>
						</div>
						<p className="text-2xl font-mono font-bold text-[#a60202] select-all tracking-wide">
							{referenceNumber}
						</p>
					</div>

					{/* Email confirmation */}
					<div className="flex items-start gap-3 text-sm text-gray-600">
						<Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
						<p>
							Confirmation sent to{" "}
							<span className="font-medium text-gray-900">{citizenEmail}</span>
						</p>
					</div>
				</div>

				{/* Footer */}
				<DialogFooter className="px-6 pb-5 pt-0 flex-col sm:flex-col gap-2">
					<Button
						className="w-full bg-[#a60202] hover:bg-[#8b0202] text-white h-11 rounded-xl cursor-pointer font-semibold"
						onClick={() => onOpenChange(false)}
					>
						Done
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="w-full text-gray-500 hover:text-[#a60202] cursor-pointer"
						onClick={handlePrint}
					>
						<Printer className="w-4 h-4 mr-1.5" />
						Print Receipt
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
