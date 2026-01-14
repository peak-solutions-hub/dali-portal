export function InquirySecurityCheck() {
	return (
		<div className="bg-gray-50 p-5 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center gap-1">
			<p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
				Security Check
			</p>
			<p className="text-sm text-gray-400">
				Cloudflare Turnstile CAPTCHA will appear here
			</p>
		</div>
	);
}
