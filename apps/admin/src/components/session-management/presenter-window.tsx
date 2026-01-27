"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PresenterViewLayout } from "./presenter-view-layout";

type Slide = {
	id?: string;
	type: "cover" | "agenda-item";
	title: string;
	subtitle?: string;
	agendaNumber?: string;
	documents?: Array<{ key: string; title: string }>;
};

export function PresenterWindow({ sessionId }: { sessionId: string }) {
	const [currentSlide, setCurrentSlide] = useState<Slide | null>(null);
	const [nextSlide, setNextSlide] = useState<Slide | null>(null);
	const [currentIndex, setCurrentIndex] = useState<number>(0);
	const [totalSlides, setTotalSlides] = useState<number>(0);
	const [sessionDate, setSessionDate] = useState<string>(
		new Date().toISOString().slice(0, 10),
	);
	const [sessionTime, setSessionTime] = useState<string>(
		new Date().toISOString().slice(11, 16),
	);
	const [isConnected, setIsConnected] = useState(false);

	const channelName = useMemo(() => `dali-session-${sessionId}`, [sessionId]);

	useEffect(() => {
		const bc = new BroadcastChannel(channelName);

		const onMessage = (ev: MessageEvent) => {
			const msg = ev.data;
			if (!msg || !msg.type) return;

			switch (msg.type) {
				case "init": {
					setCurrentSlide(msg.slide ?? null);
					setNextSlide(msg.nextSlide ?? null);
					setCurrentIndex(msg.index ?? 0);
					setTotalSlides(msg.totalSlides ?? 0);
					if (msg.sessionDate) setSessionDate(msg.sessionDate);
					if (msg.sessionTime) setSessionTime(msg.sessionTime);
					break;
				}
				case "slide": {
					setCurrentSlide(msg.slide ?? null);
					setNextSlide(msg.nextSlide ?? null);
					setCurrentIndex(msg.index ?? 0);
					break;
				}
				default:
					break;
			}
		};

		bc.addEventListener("message", onMessage);
		// ask for initial state
		bc.postMessage({ type: "request-init" });
		setIsConnected(true);

		return () => {
			bc.removeEventListener("message", onMessage);
			bc.close();
			setIsConnected(false);
		};
	}, [channelName]);

	const postControl = useCallback(
		(action: "next" | "prev" | "goto", index?: number) => {
			const bc = new BroadcastChannel(channelName);
			if (action === "goto" && typeof index === "number") {
				bc.postMessage({ type: "control", action: "goto", index });
			} else {
				bc.postMessage({ type: "control", action });
			}
			bc.close();
		},
		[channelName],
	);

	const handleNext = useCallback(() => postControl("next"), [postControl]);
	const handlePrev = useCallback(() => postControl("prev"), [postControl]);
	const handleGoto = useCallback(
		(i: number) => postControl("goto", i),
		[postControl],
	);
	const handleOpenDisplay = useCallback(() => {
		window.open(`/session-display?session=${encodeURIComponent(sessionId)}`);
	}, [sessionId]);

	return (
		<div className="h-screen bg-gray-50 p-6">
			<div className="max-w-7xl mx-auto">
				<div className="flex items-center justify-between mb-4">
					<div>
						<div className="text-sm font-medium text-gray-700">
							Presenter View
						</div>
						<div className="text-xs text-gray-500">
							Channel: {channelName}{" "}
							{isConnected ? "(connected)" : "(disconnected)"}
						</div>
					</div>
					<div>
						<button
							className="px-3 py-1 bg-red-600 text-white rounded"
							onClick={() => window.close()}
						>
							Close
						</button>
					</div>
				</div>

				{currentSlide ? (
					<PresenterViewLayout
						currentSlide={currentSlide}
						nextSlide={nextSlide ?? undefined}
						sessionDate={sessionDate}
						sessionTime={sessionTime}
						currentSlideIndex={currentIndex}
						totalSlides={totalSlides}
						sessionNumber={sessionId}
						onNext={handleNext}
						onPrev={handlePrev}
						onGoto={handleGoto}
						onOpenDisplay={handleOpenDisplay}
					/>
				) : (
					<div className="h-80 flex items-center justify-center">
						Waiting for presenter...
					</div>
				)}
			</div>
		</div>
	);
}
