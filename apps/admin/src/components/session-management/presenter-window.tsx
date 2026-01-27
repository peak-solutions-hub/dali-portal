"use client";

import type { SessionPresentationSlide } from "@repo/shared";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PresenterViewLayout } from "./presenter-view-layout";

export function PresenterWindow({ sessionId }: { sessionId: string }) {
	const [currentSlide, setCurrentSlide] =
		useState<SessionPresentationSlide | null>(null);
	const [nextSlide, setNextSlide] = useState<SessionPresentationSlide | null>(
		null,
	);
	const [currentIndex, setCurrentIndex] = useState<number>(0);
	const [totalSlides, setTotalSlides] = useState<number>(0);
	const [slides, setSlides] = useState<SessionPresentationSlide[]>([]);
	const [sessionDate, setSessionDate] = useState<string>(
		new Date().toISOString().slice(0, 10),
	);
	const [sessionTime, setSessionTime] = useState<string>(
		new Date().toISOString().slice(11, 16),
	);

	const channelName = useMemo(() => `dali-session-${sessionId}`, [sessionId]);

	useEffect(() => {
		const bc = new BroadcastChannel(channelName);
		bc.postMessage({ type: "presenter-window-opened" });

		const onMessage = (ev: MessageEvent) => {
			const msg = ev.data;
			if (!msg || !msg.type) return;

			switch (msg.type) {
				case "init": {
					setCurrentSlide(msg.slide ?? null);
					setNextSlide(msg.nextSlide ?? null);
					setCurrentIndex(msg.index ?? 0);
					setTotalSlides(msg.totalSlides ?? 0);
					if (Array.isArray(msg.slides)) setSlides(msg.slides);
					if (msg.sessionDate) setSessionDate(msg.sessionDate);
					if (msg.sessionTime) setSessionTime(msg.sessionTime);
					break;
				}
				case "slide": {
					setCurrentSlide(msg.slide ?? null);
					setNextSlide(msg.nextSlide ?? null);
					setCurrentIndex(msg.index ?? 0);
					if (typeof msg.totalSlides === "number")
						setTotalSlides(msg.totalSlides);
					if (msg.sessionDate) setSessionDate(msg.sessionDate);
					if (msg.sessionTime) setSessionTime(msg.sessionTime);
					break;
				}
				case "presenter-window-close-request": {
					window.close();
					break;
				}
				default:
					break;
			}
		};

		bc.addEventListener("message", onMessage);
		// ask for initial state
		bc.postMessage({ type: "request-init" });

		const onBeforeUnload = () => {
			try {
				const c = new BroadcastChannel(channelName);
				c.postMessage({ type: "presenter-window-closed" });
				c.close();
			} catch {
				// ignore
			}
		};
		window.addEventListener("beforeunload", onBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", onBeforeUnload);
			bc.removeEventListener("message", onMessage);
			bc.close();
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

	const handleNext = useCallback(() => {
		postControl("next");
	}, [postControl]);
	const handlePrev = useCallback(() => {
		postControl("prev");
	}, [postControl]);
	const handleGoto = useCallback(
		(i: number) => {
			postControl("goto", i);
		},
		[postControl],
	);

	return (
		<div className="h-screen bg-gray-50">
			{currentSlide ? (
				<PresenterViewLayout
					currentSlide={currentSlide}
					nextSlide={nextSlide ?? undefined}
					sessionDate={sessionDate}
					sessionTime={sessionTime}
					currentSlideIndex={currentIndex}
					totalSlides={totalSlides}
					slides={slides}
					sessionNumber={sessionId}
					onNext={handleNext}
					onPrev={handlePrev}
					onGoto={handleGoto}
				/>
			) : (
				<div className="h-full flex items-center justify-center">
					Waiting for presenter...
				</div>
			)}
		</div>
	);
}
