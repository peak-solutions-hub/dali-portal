"use client";

import { formatSessionTime } from "@repo/shared";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DrawingCanvas } from "@/components/session-management/drawing-canvas";
import {
	AgendaSlide,
	CoverSlide,
} from "@/components/session-management/slides";

type Slide = {
	id?: string;
	type: "cover" | "agenda-item";
	title: string;
	subtitle?: string;
	agendaNumber?: string;
	documents?: Array<{ key: string; title: string }>;
};

function formatElapsed(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	if (h > 0) {
		return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
	}
	return `${m}m ${String(s).padStart(2, "0")}s`;
}

export default function SessionDisplayPage() {
	const params = useSearchParams();
	const sessionId = params.get("session") ?? "unknown";
	const [isFullscreen, setIsFullscreen] = useState(false);

	const [currentSlide, setCurrentSlide] = useState<Slide | null>(null);
	const [sessionDate, setSessionDate] = useState<string>(
		new Date().toISOString().slice(0, 10),
	);
	const [sessionTime, setSessionTime] = useState<string>(
		new Date().toISOString().slice(11, 16),
	);

	// Current clock and elapsed time
	const [currentClock, setCurrentClock] = useState(new Date());
	const sessionStartRef = useRef<Date>(new Date());
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			const now = new Date();
			setCurrentClock(now);
			setElapsedSeconds(
				Math.floor((now.getTime() - sessionStartRef.current.getTime()) / 1000),
			);
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	const channelName = useMemo(() => `dali-session-${sessionId}`, [sessionId]);

	useEffect(() => {
		const onFull = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener("fullscreenchange", onFull);
		return () => document.removeEventListener("fullscreenchange", onFull);
	}, []);

	useEffect(() => {
		const enterFullscreen = async () => {
			try {
				await document.documentElement.requestFullscreen();
				setIsFullscreen(true);
			} catch {
				// ignore
			}
		};
		const exitFullscreen = async () => {
			try {
				if (document.fullscreenElement) await document.exitFullscreen();
				setIsFullscreen(false);
			} catch {
				// ignore
			}
		};

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "f") {
				if (isFullscreen) void exitFullscreen();
				else void enterFullscreen();
			}
			if (e.key === "Escape" && isFullscreen) {
				void exitFullscreen();
			}
		};

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [isFullscreen]);

	useEffect(() => {
		const bc = new BroadcastChannel(channelName);

		const onMessage = (ev: MessageEvent) => {
			const msg = ev.data;
			if (!msg || !msg.type) return;

			switch (msg.type) {
				case "init":
				case "slide": {
					setCurrentSlide(msg.slide ?? null);
					if (msg.sessionDate) setSessionDate(msg.sessionDate);
					if (msg.sessionTime) setSessionTime(msg.sessionTime);
					break;
				}
				default:
					break;
			}
		};

		bc.addEventListener("message", onMessage);
		bc.postMessage({ type: "request-init" });

		return () => {
			bc.removeEventListener("message", onMessage);
			bc.close();
		};
	}, [channelName]);

	return (
		<div className="h-screen w-screen bg-white">
			{currentSlide ? (
				<div className="h-full w-full flex items-center justify-center p-4 sm:p-10 lg:p-20">
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
			) : (
				<div className="h-full w-full flex items-center justify-center text-gray-500">
					Waiting for presentation…
				</div>
			)}

			{/* Time Overlay for Viewers */}
			{currentSlide && (
				<div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
					<div className="flex items-center justify-between px-6 py-3 bg-linear-to-t from-black/70 to-transparent">
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								<div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
								<span className="text-sm font-medium text-white/90">LIVE</span>
							</div>
							<div className="h-4 w-px bg-white/30" />
							<span className="text-sm text-white/80">
								Elapsed: {formatElapsed(elapsedSeconds)}
							</span>
						</div>
						<div className="flex items-center gap-4">
							<span className="text-sm text-white/70">
								Session started:{" "}
								{formatSessionTime(`${sessionDate}T${sessionTime}`)}
							</span>
							<div className="h-4 w-px bg-white/30" />
							<span className="text-lg font-semibold text-white tabular-nums">
								{currentClock.toLocaleTimeString("en-US", {
									hour: "2-digit",
									minute: "2-digit",
									second: "2-digit",
									hour12: true,
									timeZone: "Asia/Manila",
								})}
							</span>
						</div>
					</div>
				</div>
			)}

			<DrawingCanvas
				channelName={channelName}
				active={false}
				isEraser={false}
			/>
		</div>
	);
}
