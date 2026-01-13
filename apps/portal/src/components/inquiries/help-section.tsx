"use client";

import { HelpCircle, Mail, Phone } from "@repo/ui/lib/lucide-react";

export function HelpSection() {
	return (
		<div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-100 rounded-xl p-6 flex items-start gap-4 shadow-sm">
			<div className="bg-[#a60202] rounded-full p-2.5 shrink-0 shadow-md">
				<HelpCircle className="w-5 h-5 text-white" />
			</div>
			<div className="space-y-2.5 flex-1">
				<h3 className="font-semibold text-gray-900 text-lg">Need Help?</h3>
				<p className="text-sm text-gray-700 leading-relaxed">
					If you're having trouble or need immediate assistance, please contact
					our office directly.
				</p>
				<div className="flex flex-col sm:flex-row gap-3 sm:gap-6 pt-1">
					<a
						href="tel:+63333370280"
						className="flex items-center gap-2 text-sm text-gray-900 hover:text-[#a60202] transition-colors"
					>
						<Phone className="w-4 h-4" />
						<span className="font-medium">(033) 337-0280</span>
					</a>
					<a
						href="mailto:inquiries@iloilocity.gov.ph"
						className="flex items-center gap-2 text-sm text-gray-900 hover:text-[#a60202] transition-colors"
					>
						<Mail className="w-4 h-4" />
						<span className="font-medium">inquiries@iloilocity.gov.ph</span>
					</a>
				</div>
			</div>
		</div>
	);
}
