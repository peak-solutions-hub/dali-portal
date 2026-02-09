"use client";

import { formatSessionDate, formatSessionTime } from "@repo/shared";

export function CoverSlide({
	title,
	subtitle,
	date,
	time,
	compact = false,
}: {
	title: string;
	subtitle: string;
	date: string;
	time: string;
	compact?: boolean;
}) {
	if (compact) {
		return (
			<div className="w-full h-full flex items-center justify-center overflow-hidden">
				<div className="text-center text-white scale-[0.25] origin-center whitespace-nowrap">
					{/* Logo */}
					<div className="flex justify-center mb-3">
						<div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center">
							<svg
								className="w-14 h-14 text-[#a60202]"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M12 2L2 7l10 5 10-5-10-5z" />
								<path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
							</svg>
						</div>
					</div>
					<h1 className="text-5xl font-bold text-white leading-tight mb-2">
						{title}
					</h1>
					<p className="text-3xl text-white/90 mb-2">{subtitle}</p>
					<p className="text-2xl text-white/80">{formatSessionDate(date)}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="text-center space-y-8 max-w-4xl w-full mx-auto text-white p-12 rounded-lg">
			{/* Logo */}
			<div className="flex justify-center mb-8">
				<div className="w-32 h-32 bg-white/50 rounded-full flex items-center justify-center">
					<svg
						className="w-20 h-20 text-[#a60202]"
						fill="currentColor"
						viewBox="0 0 24 24"
					>
						<path d="M12 2L2 7l10 5 10-5-10-5z" />
						<path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
					</svg>
				</div>
			</div>

			<h1 className="text-5xl font-bold text-white">{title}</h1>
			<p className="text-3xl text-white/90">{subtitle}</p>
			<p className="text-2xl text-white/80">{formatSessionDate(date)}</p>
			<p className="text-xl text-white/80">
				{formatSessionTime(`${date}T${time}`)}
			</p>
			<p className="text-lg text-white/70 mt-8">
				Press → to begin or click Navigation to jump to a specific item
			</p>
		</div>
	);
}

export function AgendaSlide({
	agendaNumber,
	title,
	documents,
	compact = false,
}: {
	agendaNumber: string;
	title: string;
	documents?: Array<{ key: string; title: string }>;
	compact?: boolean;
}) {
	// Strip leading numbers from title (e.g., "1. Title" -> "Title")
	const displayTitle = title.replace(/^\d+\.?\s*/, "");

	if (compact) {
		return (
			<div className="w-full h-full flex items-center justify-center p-2">
				<div className="text-center space-y-2 text-white transform scale-[0.35] origin-center">
					<div className="text-6xl font-bold text-white/50">{agendaNumber}</div>
					<h2 className="text-2xl font-bold text-white leading-tight max-w-md">
						{displayTitle}
					</h2>
				</div>
			</div>
		);
	}

	return (
		<div className="text-center space-y-12 max-w-4xl w-full mx-auto text-white p-12 rounded-lg">
			<div className="text-8xl font-bold text-white/50">{agendaNumber}</div>
			<h2 className="text-4xl font-bold text-white">{displayTitle}</h2>

			{documents && documents.length > 0 && (
				<div className="mt-16 space-y-4">
					{documents.map((doc, index) => (
						<div
							key={index}
							className="bg-white/10 border border-white/20 rounded-lg p-6 text-left backdrop-blur-sm"
						>
							<p className="text-xl font-semibold text-white mb-2">{doc.key}</p>
							<p className="text-lg text-white/80">{doc.title}</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
