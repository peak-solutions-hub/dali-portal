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
	const scale = compact ? 0.7 : 1;

	return (
		<div
			className="text-center space-y-8 max-w-4xl mx-autotext-white p-12 rounded-lg"
			style={{ transform: `scale(${scale})` }}
		>
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
			{!compact && (
				<p className="text-lg text-white/70 mt-8">
					Press → to begin or click Navigation to jump to a specific item
				</p>
			)}
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
	const scale = compact ? 0.6 : 1;

	return (
		<div
			className="text-center space-y-12 max-w-4xl w-full mx-auto text-white p-12 rounded-lg"
			style={{ transform: `scale(${scale})` }}
		>
			<div className="text-8xl font-bold text-white/50">{agendaNumber}</div>
			<h2 className="text-4xl font-bold text-white">{title}</h2>

			{!compact && documents && documents.length > 0 && (
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
