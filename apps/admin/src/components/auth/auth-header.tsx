import { Lock, Shield } from "@repo/ui/lib/lucide-react";

export function AuthHeader() {
	return (
		<div className="text-center mb-8">
			<div className="mb-6 flex justify-center">
				<div className="relative">
					<img
						src="/iloilo-city-seal.png"
						alt="Iloilo City Council Seal"
						className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
					/>
					<div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-[#a60202] flex items-center justify-center shadow-lg">
						<Shield className="w-4 h-4 text-[#FFC107]" />
					</div>
				</div>
			</div>

			<h1
				className="text-2xl sm:text-3xl text-[#a60202] mb-2"
				style={{ fontFamily: "Playfair Display, serif" }}
			>
				Sangguniang Panlungsod
			</h1>
			<p className="text-gray-700 text-sm mb-1">ng Iloilo</p>
			<div className="flex items-center justify-center gap-2 mt-3">
				<div className="h-px w-12 bg-[#FFC107]" />
				<Lock className="w-4 h-4 text-[#a60202]" />
				<div className="h-px w-12 bg-[#FFC107]" />
			</div>
			<p className="text-xs text-gray-600 mt-3 font-medium">
				Internal Management System
			</p>
		</div>
	);
}
