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
		<div className="h-full w-full flex items-center justify-center px-16 py-20 bg-red-700">
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
	);
}
