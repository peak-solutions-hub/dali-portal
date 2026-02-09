"use client";

import type {
	SessionPresentationSlide,
	SessionPresentationSlideDocument,
} from "@repo/shared";
import { FileText, Minus, Plus } from "@repo/ui/lib/lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AgendaSlide, CoverSlide } from "../slides";

export function PresenterSidePanel({
	currentSlide,
	nextSlide,
	sessionDate,
	sessionTime,
	currentSlideIndex,
	totalSlides,
	sessionNumber,
	elapsedTime,
}: {
	currentSlide: SessionPresentationSlide;
	nextSlide?: SessionPresentationSlide;
	sessionDate: string;
	sessionTime: string;
	currentSlideIndex: number;
	totalSlides: number;
	sessionNumber?: string;
	elapsedTime?: string;
}) {
	const [currentTime, setCurrentTime] = useState(new Date());
	const [notes, setNotes] = useState("");
	const [fontSize, setFontSize] = useState(14);
	const notesLimit = 5000;

	const notesStorageKey = useMemo(
		() => `dali-presenter-notes-${sessionNumber ?? "unknown"}`,
		[sessionNumber],
	);
	const slideNotesKey = useMemo(
		() => currentSlide.id ?? String(currentSlideIndex),
		[currentSlide.id, currentSlideIndex],
	);

	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(notesStorageKey);
			const parsed: Record<string, string> = raw ? JSON.parse(raw) : {};
			setNotes((parsed[slideNotesKey] ?? "").slice(0, notesLimit));
		} catch {
			setNotes("");
		}
	}, [notesLimit, notesStorageKey, slideNotesKey]);

	const documents = currentSlide.documents ?? [];

	return (
		<div className="flex flex-col h-full bg-gray-900">
			{/* Header with time */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
				<span className="text-sm text-gray-400">
					{elapsedTime ?? "0:00:00"}
				</span>
				<span className="text-lg font-semibold text-white">
					{currentTime.toLocaleTimeString("en-US", {
						hour: "2-digit",
						minute: "2-digit",
						hour12: true,
					})}
				</span>
			</div>

			{/* Next Slide Preview */}
			<div className="p-4 border-b border-gray-800">
				<div className="text-sm text-gray-400 mb-2">Next slide</div>
				{nextSlide ? (
					<div
						className="bg-red-700 rounded overflow-hidden"
						style={{ aspectRatio: "16/9" }}
					>
						<div className="w-full h-full flex items-center justify-center scale-75">
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
						className="flex items-center justify-center text-sm text-gray-500 bg-gray-800 rounded"
						style={{ aspectRatio: "16/9" }}
					>
						End of presentation
					</div>
				)}
			</div>

			{/* Documents for discussion (if any) */}
			{documents.length > 0 && (
				<div className="p-4 border-b border-gray-800">
					<div className="text-sm text-gray-400 mb-2">
						Documents for Discussion
					</div>
					<div className="space-y-2 max-h-32 overflow-y-auto">
						{documents.map((doc, idx) => (
							<div
								key={idx}
								className="flex items-start gap-2 bg-gray-800 rounded-lg p-2"
							>
								<FileText className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
								<div className="min-w-0">
									<div className="text-xs font-medium text-white truncate">
										{doc.key}
									</div>
									<div className="text-xs text-gray-400 truncate">
										{doc.title}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Notes Section - Expands to fill remaining space */}
			<div className="flex-1 flex flex-col min-h-0 p-4">
				<div className="flex-1 min-h-0 overflow-auto">
					{notes ? (
						<p
							className="text-gray-300 whitespace-pre-wrap"
							style={{ fontSize: `${fontSize}px` }}
						>
							{notes}
						</p>
					) : (
						<p className="text-gray-500 text-lg">No Notes.</p>
					)}
				</div>

				{/* Notes input (hidden by default, toggle to edit) */}
				<textarea
					value={notes}
					onChange={(e) => {
						const value = e.target.value.slice(0, notesLimit);
						setNotes(value);
						try {
							const raw = localStorage.getItem(notesStorageKey);
							const parsed: Record<string, string> = raw ? JSON.parse(raw) : {};
							parsed[slideNotesKey] = value;
							localStorage.setItem(notesStorageKey, JSON.stringify(parsed));
						} catch {
							// ignore storage errors
						}
					}}
					className="sr-only"
					placeholder="Add speaker notes..."
				/>
			</div>

			{/* Font size controls */}
			<div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-800">
				<button
					type="button"
					onClick={() => setFontSize((s) => Math.max(10, s - 2))}
					className="flex items-center justify-center h-8 w-8 rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer"
					title="Decrease font size"
				>
					<span className="text-lg font-serif">A</span>
					<Minus className="h-2 w-2 ml-0.5" />
				</button>
				<button
					type="button"
					onClick={() => setFontSize((s) => Math.min(24, s + 2))}
					className="flex items-center justify-center h-8 w-8 rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer"
					title="Increase font size"
				>
					<span className="text-xl font-serif">A</span>
					<Plus className="h-2 w-2 ml-0.5" />
				</button>
			</div>
		</div>
	);
}
