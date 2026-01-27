"use client";

import { formatSessionDate, formatSessionTime } from "@repo/shared";
import React, { useEffect, useState } from "react";

type SlideDocument = { key: string; title: string };

type Slide = {
	id?: string;
	type: "cover" | "agenda-item";
	title: string;
	subtitle?: string;
	agendaNumber?: string;
	documents?: SlideDocument[];
};

export function PresenterViewLayout({
	currentSlide,
	nextSlide,
	sessionDate,
	sessionTime,
	currentSlideIndex,
	totalSlides,
	sessionNumber,
	onNext,
	onPrev,
	onGoto,
	onOpenDisplay,
}: {
	currentSlide: Slide;
	nextSlide?: Slide;
	sessionDate: string;
	sessionTime: string;
	currentSlideIndex: number;
	totalSlides: number;
	sessionNumber?: string;
	onNext?: () => void;
	onPrev?: () => void;
	onGoto?: (index: number) => void;
	onOpenDisplay?: () => void;
}) {
	const [currentTime, setCurrentTime] = useState(new Date());

	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	return (
		<div className="h-screen pt-12 pb-16 px-6 bg-gray-50">
			<div className="h-full max-w-7xl mx-auto grid grid-cols-3 gap-6">
				<div className="col-span-2 bg-white rounded-lg shadow-lg border border-gray-200 p-8 flex items-center justify-center">
					<div className="w-full">
						<div className="text-xs font-semibold text-gray-500 mb-4">
							CURRENT SLIDE
						</div>
						{currentSlide.type === "cover" ? (
							<div className="space-y-8 max-w-4xl mx-auto text-center">
								<div className="flex justify-center mb-8">
									<div className="w-24 h-24 bg-[#a60202] rounded-full" />
								</div>
								<div className="text-3xl font-bold text-gray-900">
									{currentSlide.title}
								</div>
								<div className="text-sm text-gray-600">
									{currentSlide.subtitle}
								</div>
							</div>
						) : (
							<div className="space-y-2 text-center">
								<div className="text-5xl font-bold text-gray-900">
									{currentSlide.agendaNumber}
								</div>
								<div className="text-sm font-semibold text-gray-900">
									{currentSlide.title}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Right Panel */}
				<div className="space-y-6">
					{" "}
					<div className="flex gap-2 justify-end mb-2">
						{onPrev && (
							<button
								type="button"
								onClick={onPrev}
								className="px-3 py-1 bg-gray-100 text-gray-700 rounded"
							>
								Prev
							</button>
						)}
						{onNext && (
							<button
								type="button"
								onClick={onNext}
								className="px-3 py-1 bg-gray-100 text-gray-700 rounded"
							>
								Next
							</button>
						)}
						<button
							type="button"
							onClick={() => {
								if (onOpenDisplay) onOpenDisplay();
								else if (sessionNumber)
									window.open(
										`/session-display?session=${encodeURIComponent(sessionNumber)}`,
									);
							}}
							className="px-3 py-1 bg-[#a60202] text-white rounded"
						>
							Open Display
						</button>
					</div>{" "}
					<div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
						<div className="text-xs font-semibold text-gray-500 mb-4">
							NEXT SLIDE
						</div>
						{nextSlide ? (
							<div className="bg-gray-50 rounded border border-gray-200 p-4 min-h-50 flex items-center justify-center">
								<div className="text-center scale-75 origin-center">
									{nextSlide.type === "cover" ? (
										<div className="space-y-2">
											<div className="font-bold text-gray-900">
												{nextSlide.title}
											</div>
											<div className="text-sm text-gray-600">
												{nextSlide.subtitle}
											</div>
										</div>
									) : (
										<div className="space-y-2">
											<div className="text-3xl font-bold text-gray-900">
												{nextSlide.agendaNumber}
											</div>
											<div className="text-sm font-semibold text-gray-900">
												{nextSlide.title}
											</div>
										</div>
									)}
								</div>
							</div>
						) : (
							<div className="bg-gray-50 rounded border border-gray-200 p-8 min-h-50 flex items-center justify-center text-gray-400 text-sm">
								Last slide
							</div>
						)}
					</div>
					<div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 space-y-4">
						<div>
							<div className="text-xs font-semibold text-gray-500 mb-1">
								SESSION INFO
							</div>
							<div className="text-sm text-gray-900">
								{formatSessionDate(sessionDate)}
							</div>
							<div className="text-sm text-gray-600">
								{formatSessionTime(`${sessionDate}T${sessionTime}`)}
							</div>
						</div>

						<div className="border-t border-gray-200 pt-4">
							<div className="text-xs font-semibold text-gray-500 mb-1">
								CURRENT TIME
							</div>
							<div className="text-2xl font-bold text-gray-900">
								{currentTime.toLocaleTimeString("en-US", {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</div>
						</div>

						<div className="border-t border-gray-200 pt-4">
							<div className="text-xs font-semibold text-gray-500 mb-1">
								PROGRESS
							</div>
							<div className="flex items-center gap-2">
								<div className="flex-1 bg-gray-200 rounded-full h-2">
									<div
										className="bg-[#a60202] h-2 rounded-full transition-all"
										style={{
											width: `${((currentSlideIndex + 1) / totalSlides) * 100}%`,
										}}
									/>
								</div>
								<span className="text-sm font-medium text-gray-900">
									{currentSlideIndex + 1}/{totalSlides}
								</span>
							</div>
						</div>
					</div>
					{currentSlide.documents && currentSlide.documents.length > 0 && (
						<div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
							<div className="text-xs font-semibold text-gray-500 mb-3">
								DOCUMENTS
							</div>
							<div className="space-y-2 max-h-40 overflow-y-auto">
								{currentSlide.documents.map(
									(doc: SlideDocument, index: number) => (
										<div
											key={index}
											className="text-xs bg-gray-50 rounded p-2 border border-gray-200"
										>
											<div className="font-semibold text-gray-900">
												{doc.key}
											</div>
											<div className="text-gray-600">{doc.title}</div>
										</div>
									),
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
