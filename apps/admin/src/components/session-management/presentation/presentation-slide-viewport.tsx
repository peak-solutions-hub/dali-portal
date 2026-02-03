"use client";

import type { SessionPresentationSlide } from "@repo/shared";
import { AgendaSlide, CoverSlide } from "../slides";

export function PresentationSlideViewport({
	slide,
	sessionDate,
	sessionTime,
}: {
	slide: SessionPresentationSlide;
	sessionDate: string;
	sessionTime: string;
}) {
	return (
		<div className="h-screen w-screen flex items-center justify-center px-16 py-20 bg-red-700/90">
			{slide.type === "cover" ? (
				<CoverSlide
					title={slide.title}
					subtitle={slide.subtitle!}
					date={sessionDate}
					time={sessionTime}
				/>
			) : (
				<AgendaSlide
					agendaNumber={slide.agendaNumber!}
					title={slide.title}
					documents={slide.documents}
				/>
			)}
		</div>
	);
}
