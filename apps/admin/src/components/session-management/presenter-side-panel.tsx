"use client";

import type {
	SessionPresentationSlide,
	SessionPresentationSlideDocument,
} from "@repo/shared";
import { formatSessionDate, formatSessionTime } from "@repo/shared";
import React, { useEffect, useMemo, useState } from "react";
import { AgendaSlide, CoverSlide } from "./slides";

export function PresenterSidePanel({
	currentSlide,
	nextSlide,
	sessionDate,
	sessionTime,
	currentSlideIndex,
	totalSlides,
	sessionNumber,
}: {
	currentSlide: SessionPresentationSlide;
	nextSlide?: SessionPresentationSlide;
	sessionDate: string;
	sessionTime: string;
	currentSlideIndex: number;
	totalSlides: number;
	sessionNumber?: string;
}) {
	const [currentTime, setCurrentTime] = useState(new Date());
	const [notes, setNotes] = useState("");
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

	const progressWidth = useMemo(() => {
		if (!totalSlides || totalSlides <= 0) return 0;
		return ((currentSlideIndex + 1) / totalSlides) * 100;
	}, [currentSlideIndex, totalSlides]);

	return (
		<div className="space-y-4 sm:space-y-6">
			<div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
				<div className="text-xs font-semibold text-gray-500 mb-3">NOTES</div>
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
					className="w-full min-h-28 resize-y rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none focus:bg-white"
					placeholder="Add speaker notes for this slide…"
				/>
				<div className="mt-2 text-xs text-gray-500 text-right">
					{notes.length}/{notesLimit}
				</div>
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
								style={{ width: `${progressWidth}%` }}
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
							(doc: SessionPresentationSlideDocument, index: number) => (
								<div
									key={index}
									className="text-xs bg-gray-50 rounded p-2 border border-gray-200"
								>
									<div className="font-semibold text-gray-900">{doc.key}</div>
									<div className="text-gray-600">{doc.title}</div>
								</div>
							),
						)}
					</div>
				</div>
			)}

			<div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
				<div className="text-xs font-semibold text-gray-500 mb-4">
					NEXT SLIDE
				</div>
				{nextSlide ? (
					<div className="bg-gray-50 rounded border border-gray-200 p-4 flex items-center justify-center">
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
				) : (
					<div className="text-sm text-gray-600">No next slide</div>
				)}
			</div>
		</div>
	);
}
