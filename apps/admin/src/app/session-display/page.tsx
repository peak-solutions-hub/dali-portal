"use client";

import { useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
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
			<DrawingCanvas
				channelName={channelName}
				active={false}
				isEraser={false}
			/>
		</div>
	);
}
