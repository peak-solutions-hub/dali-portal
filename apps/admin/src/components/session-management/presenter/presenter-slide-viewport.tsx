"use client";

import type { SessionPresentationSlide } from "@repo/shared";
import { AgendaSlide, CoverSlide } from "../slides";

export function PresenterSlideViewport({
	currentSlide,
	sessionDate,
	sessionTime,
}: {
	currentSlide: SessionPresentationSlide;
	sessionDate: string;
	sessionTime: string;
}) {
	return (
		<div className="h-full w-full bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col overflow-hidden">
			<div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
				<div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
					Current Slide
				</div>
			</div>
			{/* Match presentation mode scale */}
			<div className="flex-1 min-h-0 flex items-center justify-center p-20 bg-gray-50">
				{currentSlide.type === "cover" ? (
					<CoverSlide
						title={currentSlide.title}
						subtitle={currentSlide.subtitle ?? ""}
						date={sessionDate}
						time={sessionTime}
					/>
				) : (
					<AgendaSlide
						agendaNumber={currentSlide.agendaNumber ?? ""}
						title={currentSlide.title}
						documents={currentSlide.documents}
					/>
				)}
			</div>
		</div>
	);
}
