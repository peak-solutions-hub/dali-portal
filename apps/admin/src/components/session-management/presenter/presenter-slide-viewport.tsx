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
		<div className="lg:col-span-2 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col">
			<div className="text-xs font-semibold text-gray-500 mb-4">
				CURRENT SLIDE
			</div>
			<div className="flex-1 min-h-0 flex items-center justify-center">
				<div className="h-screen flex items-center justify-center p-20">
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
		</div>
	);
}
