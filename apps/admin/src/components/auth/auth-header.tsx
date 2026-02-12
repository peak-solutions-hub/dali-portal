import type { LucideIcon } from "lucide-react";

interface AuthHeaderProps {
	title?: string;
	subtitle?: string;
	icon?: LucideIcon;
	iconClassName?: string;
}

export function AuthHeader({
	title,
	subtitle,
	icon: Icon,
	iconClassName = "w-4 h-4 text-[#a60202]",
}: AuthHeaderProps) {
	return (
		<div className="text-center mb-6">
			<div className="mb-4 flex justify-center">
				<div className="relative">
					<img
						src="/iloilo-city-seal.png"
						alt="Iloilo City Council Seal"
						className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
					/>
				</div>
			</div>

			<h1
				className="text-3xl text-[#a60202] mb-1"
				style={{ fontFamily: '"Playfair Display", sans-serif' }}
			>
				Sangguniang Panlungsod
			</h1>
			<p
				className="text-gray-700 text-xl mb-3"
				style={{ fontFamily: '"Playfair Display", sans-serif' }}
			>
				ng Iloilo
			</p>

			{Icon && (
				<div className="flex items-center justify-center gap-2 mt-2">
					<div className="h-px w-36 bg-[#FFC107]" />
					<Icon className={iconClassName} />
					<div className="h-px w-36 bg-[#FFC107]" />
				</div>
			)}

			{title && (
				<p className="text-lg font-semibold text-gray-900 mt-3">{title}</p>
			)}
			{subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
		</div>
	);
}
