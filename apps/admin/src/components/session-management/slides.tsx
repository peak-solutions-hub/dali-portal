"use client";

import { formatSessionDate, formatSessionTime } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Pencil } from "@repo/ui/lib/lucide-react";
import React from "react";

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
			className="text-center space-y-8 max-w-4xl mx-auto"
			style={{ transform: `scale(${scale})` }}
		>
			{/* Logo */}
			<div className="flex justify-center mb-8">
				<div className="w-32 h-32 bg-[#a60202] rounded-full flex items-center justify-center">
					<svg
						className="w-20 h-20 text-white"
						fill="currentColor"
						viewBox="0 0 24 24"
					>
						<path d="M12 2L2 7l10 5 10-5-10-5z" />
						<path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
					</svg>
				</div>
			</div>

			<h1 className="text-5xl font-bold text-gray-900">{title}</h1>
			<p className="text-3xl text-gray-700">{subtitle}</p>
			<p className="text-2xl text-gray-600">{formatSessionDate(date)}</p>
			<p className="text-xl text-gray-600">
				{formatSessionTime(`${date}T${time}`)}
			</p>
			{!compact && (
				<p className="text-lg text-gray-500 mt-8">
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
			className="text-center space-y-12 max-w-4xl w-full mx-auto"
			style={{ transform: `scale(${scale})` }}
		>
			<div className="text-8xl font-bold text-gray-900">{agendaNumber}</div>
			<h2 className="text-4xl font-bold text-gray-900">{title}</h2>

			{!compact && documents && documents.length > 0 && (
				<div className="mt-16 space-y-4">
					{documents.map((doc, index) => (
						<div
							key={index}
							className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-left"
						>
							<p className="text-xl font-semibold text-gray-900 mb-2">
								{doc.key}
							</p>
							<p className="text-lg text-gray-600">{doc.title}</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
