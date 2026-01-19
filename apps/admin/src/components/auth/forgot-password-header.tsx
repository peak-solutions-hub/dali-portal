import { Mail, Shield } from "@repo/ui/lib/lucide-react";

export function ForgotPasswordHeader() {
	return (
		<div className="text-center mb-6">
			<div className="mb-4 flex justify-center">
				<div className="relative">
					<img
						src="/iloilo-city-seal.png"
						alt="Iloilo City Council Seal"
						className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
					/>
					<div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#a60202] flex items-center justify-center shadow-lg">
						<Shield className="w-4 h-4 text-[#FFC107]" />
					</div>
				</div>
			</div>

			<h1
				className="text-xl sm:text-2xl text-[#a60202] mb-1"
				style={{ fontFamily: "Playfair Display, serif" }}
			>
				Sangguniang Panlungsod
			</h1>
			<p className="text-gray-700 text-xs mb-3">ng Iloilo</p>

			<div className="flex items-center justify-center gap-2 mt-2">
				<div className="h-px w-8 bg-[#FFC107]" />
				<Mail className="w-4 h-4 text-[#a60202]" />
				<div className="h-px w-8 bg-[#FFC107]" />
			</div>

			<h2 className="text-lg font-semibold text-gray-900 mt-3">
				Forgot Password
			</h2>
			<p className="text-xs text-gray-600 mt-1">
				Enter your email to receive a password reset link
			</p>
		</div>
	);
}
