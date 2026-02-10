"use client";

import type { SessionPresentationSlide } from "@repo/shared";
import { FileText, Minus, Plus, Timer } from "@repo/ui/lib/lucide-react";
import { useState } from "react";
import { AgendaSlide, CoverSlide } from "../slides";

interface PresenterSidePanelProps {
	currentSlideIndex: number;
	totalSlides: number;
	currentSlide: SessionPresentationSlide;
	nextSlide?: SessionPresentationSlide;
	sessionDate: string;
	sessionTime: string;
	currentTime: Date;
	elapsedSeconds: number;
	formatElapsed: (seconds: number) => string;
	notes: string;
	notesLimit: number;
	onSaveNotes: (value: string) => void;
}

export function PresenterSidePanel({
	currentSlideIndex,
	totalSlides,
	nextSlide,
	sessionDate,
	sessionTime,
	currentTime,
	elapsedSeconds,
	formatElapsed,
	notes,
	notesLimit,
	onSaveNotes,
	currentSlide,
}: PresenterSidePanelProps) {
	const [fontSize, setFontSize] = useState(14);
	const documents = currentSlide.documents ?? [];

	return (
		<div className="w-80 shrink-0 bg-black/60 backdrop-blur-lg border-l border-white/10 flex flex-col h-full">
			{/* Header with time */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
				<span className="text-sm text-white/60">
					Slide {currentSlideIndex + 1} of {totalSlides}
				</span>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5 text-sm text-white/70">
						<Timer className="h-3.5 w-3.5" />
						<span className="tabular-nums">
							{formatElapsed(elapsedSeconds)}
						</span>
					</div>
					<span className="text-lg font-semibold text-white">
						{currentTime.toLocaleTimeString("en-US", {
							hour: "2-digit",
							minute: "2-digit",
							hour12: true,
							timeZone: "Asia/Manila",
						})}
					</span>
				</div>
			</div>

			{/* Next Slide Preview */}
			<div className="p-4 border-b border-white/10">
				<div className="text-sm text-white/60 mb-2">Next slide</div>
				{nextSlide ? (
					<div
						className="bg-red-700 rounded-lg overflow-hidden"
						style={{ aspectRatio: "16/9" }}
					>
						<div className="w-full h-full flex items-center justify-center overflow-hidden">
							{nextSlide.type === "cover" ? (
								<CoverSlide
									title={nextSlide.title}
									subtitle={nextSlide.subtitle ?? ""}
									date={sessionDate}
									time={sessionTime}
									compact
								/>
							) : (
								<AgendaSlide
									agendaNumber={nextSlide.agendaNumber ?? ""}
									title={nextSlide.title}
									documents={nextSlide.documents}
									compact
								/>
							)}
						</div>
					</div>
				) : (
					<div
						className="flex items-center justify-center text-sm text-white/50 bg-white/5 rounded-lg"
						style={{ aspectRatio: "16/9" }}
					>
						End of presentation
					</div>
				)}
			</div>

			{/* Documents for discussion */}
			{documents.length > 0 && (
				<div className="p-4 border-b border-white/10">
					<div className="text-sm text-white/60 mb-2">
						Documents for Discussion
					</div>
					<div className="space-y-2 max-h-32 overflow-y-auto">
						{documents.map((doc, idx) => (
							<div
								key={idx}
								className="flex items-start gap-2 bg-white/5 rounded-lg p-2"
							>
								<FileText className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
								<div className="min-w-0">
									<div className="text-xs font-medium text-white truncate">
										{doc.key}
									</div>
									<div className="text-xs text-white/60 truncate">
										{doc.title}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Notes Section */}
			<div className="flex-1 flex flex-col min-h-0 p-4">
				<div className="text-sm text-white/60 mb-2">Speaker Notes</div>
				<textarea
					value={notes}
					onChange={(e) => {
						const value = e.target.value.slice(0, notesLimit);
						onSaveNotes(value);
					}}
					className="flex-1 w-full resize-none rounded-lg border border-white/10 bg-white/5 p-3 text-gray-200 outline-none focus:ring-1 focus:ring-red-500 min-h-0"
					style={{ fontSize: `${fontSize}px` }}
					placeholder="Add speaker notes for this slide…"
				/>
				<div className="mt-2 text-xs text-white/50 text-right">
					{notes.length}/{notesLimit}
				</div>
			</div>

			{/* Font size controls */}
			<div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10">
				<button
					type="button"
					onClick={() => setFontSize((s) => Math.max(10, s - 2))}
					className="flex items-center justify-center h-8 w-8 rounded bg-white/10 text-white/60 hover:text-white hover:bg-white/20 cursor-pointer"
					title="Decrease font size"
				>
					<span className="text-lg font-serif">A</span>
					<Minus className="h-2 w-2 ml-0.5" />
				</button>
				<button
					type="button"
					onClick={() => setFontSize((s) => Math.min(24, s + 2))}
					className="flex items-center justify-center h-8 w-8 rounded bg-white/10 text-white/60 hover:text-white hover:bg-white/20 cursor-pointer"
					title="Increase font size"
				>
					<span className="text-xl font-serif">A</span>
					<Plus className="h-2 w-2 ml-0.5" />
				</button>
			</div>
		</div>
	);
}
