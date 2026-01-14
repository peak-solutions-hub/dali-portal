"use client";

import { TurnstileWidget } from "@/components/turnstile/turnstile-widget";

interface InquirySecurityCheckProps {
	onVerify: (token: string) => void;
	onError?: () => void;
	onExpire?: () => void;
}

export function InquirySecurityCheck({
	onVerify,
	onError,
	onExpire,
}: InquirySecurityCheckProps) {
	const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

	// Show placeholder in development if no site key configured
	if (!siteKey) {
		return (
			<div className="bg-gray-50 p-5 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center gap-1">
				<p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
					Security Check
				</p>
				<p className="text-sm text-gray-400">
					Turnstile not configured (missing NEXT_PUBLIC_TURNSTILE_SITE_KEY)
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center py-2">
			<TurnstileWidget
				siteKey={siteKey}
				onVerify={onVerify}
				onError={onError}
				onExpire={onExpire}
				theme="light"
				size="normal"
				action="submit_inquiry"
			/>
		</div>
	);
}
