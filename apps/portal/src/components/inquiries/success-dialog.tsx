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
import { CheckCircle2, Copy, Printer } from "lucide-react";
import { useRef, useState } from "react";

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
	const printRef = useRef<HTMLDivElement>(null);

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
          <title>Inquiry Reference Number - ${referenceNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px; 
              max-width: 600px; 
              margin: 0 auto; 
              text-align: center;
              color: #333;
            }
            .header { 
              margin-bottom: 30px; 
              border-bottom: 2px solid #a60202;
              padding-bottom: 20px;
            }
            .logo-text {
              font-size: 24px;
              font-weight: bold;
              color: #a60202;
              margin-bottom: 5px;
            }
            .subtitle {
              font-size: 16px;
              color: #666;
            }
            .reference-box {
              background-color: #f9f9f9;
              border: 2px dashed #ccc;
              padding: 30px;
              border-radius: 10px;
              margin: 30px 0;
            }
            .label {
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 2px;
              color: #666;
              margin-bottom: 15px;
              font-weight: bold;
            }
            .reference-number {
              font-size: 42px;
              font-family: monospace;
              color: #a60202;
              font-weight: bold;
            }
            .instructions {
              font-size: 14px;
              line-height: 1.6;
              color: #555;
              text-align: left;
              background: #fff5f5;
              padding: 20px;
              border-radius: 8px;
            }
            .footer {
              margin-top: 40px;
              font-size: 12px;
              color: #999;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            @media print {
              button { display: none; }
            }
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
          
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
		printWindow.document.close();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="text-center space-y-4">
					<div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
						<CheckCircle2 className="w-8 h-8 text-green-600" />
					</div>
					<DialogTitle className="text-2xl font-bold text-gray-900">
						Inquiry Submitted!
					</DialogTitle>
					<DialogDescription className="text-base">
						We have received your inquiry. A confirmation email with your
						reference number has been sent to{" "}
						<span className="font-medium text-gray-700">{citizenEmail}</span>.
					</DialogDescription>
				</DialogHeader>

				<div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200 text-center my-2 space-y-2">
					<p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
						Reference Number
					</p>
					<div className="flex items-center justify-center gap-2 group relative">
						<p className="text-3xl font-mono font-bold text-[#a60202]">
							{referenceNumber}
						</p>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<Button
						variant="outline"
						className="w-full gap-2 border-gray-200 hover:bg-gray-50 hover:text-[#a60202]"
						onClick={handleCopy}
					>
						{copied ? (
							<CheckCircle2 className="w-4 h-4 text-green-600" />
						) : (
							<Copy className="w-4 h-4" />
						)}
						{copied ? "Copied" : "Copy ID"}
					</Button>
					<Button
						variant="outline"
						className="w-full gap-2 border-gray-200 hover:bg-gray-50 hover:text-[#a60202]"
						onClick={handlePrint}
					>
						<Printer className="w-4 h-4" />
						Print
					</Button>
				</div>

				<DialogFooter className="sm:justify-center mt-2">
					<Button
						className="w-full bg-[#a60202] hover:bg-[#8b0202] text-white font-medium"
						onClick={() => onOpenChange(false)}
					>
						Done
					</Button>
				</DialogFooter>

				{/* Hidden print content reference */}
				<div className="hidden">
					<div ref={printRef} />
				</div>
			</DialogContent>
		</Dialog>
	);
}
