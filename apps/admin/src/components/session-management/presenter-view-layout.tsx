"use client";

import type { SessionPresentationSlide } from "@repo/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DrawingCanvas } from "./drawing-canvas";
import {
	PresenterBottomBar,
	PresenterNavDrawer,
	PresenterSidePanel,
	PresenterSlideViewport,
	PresenterTopBar,
} from "./presenter";

export function PresenterViewLayout({
	currentSlide,
	nextSlide,
	sessionDate,
	sessionTime,
	currentSlideIndex,
	totalSlides,
	slides,
	sessionNumber,
	onNext,
	onPrev,
	onGoto,
}: {
	currentSlide: SessionPresentationSlide;
	nextSlide?: SessionPresentationSlide;
	sessionDate: string;
	sessionTime: string;
	currentSlideIndex: number;
	totalSlides: number;
	slides?: SessionPresentationSlide[];
	sessionNumber?: string;
	onNext?: () => void;
	onPrev?: () => void;
	onGoto?: (index: number) => void;
}) {
	const [drawingMode, setDrawingMode] = useState(false);
	const [isEraser, setIsEraser] = useState(false);
	const [showNavMenu, setShowNavMenu] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [externalDrawingActive, setExternalDrawingActive] = useState(false);

	const drawingChannelName = useMemo(() => {
		if (!sessionNumber) return undefined;
		return `dali-session-${sessionNumber}`;
	}, [sessionNumber]);

	const postPresenterDrawing = useCallback(
		(nextActive: boolean) => {
			if (!drawingChannelName) return;
			const bc = new BroadcastChannel(drawingChannelName);
			bc.postMessage({
				type: "presenter-drawing",
				active: nextActive,
				origin: "presenter",
			});
			if (!nextActive) {
				bc.postMessage({
					type: "drawing-clear",
					sourceId: `presenter-${sessionNumber ?? "unknown"}-toggle-off`,
				});
			}
			bc.close();
		},
		[drawingChannelName, sessionNumber],
	);

	const enterFullscreen = useCallback(async () => {
		try {
			await document.documentElement.requestFullscreen();
			setIsFullscreen(true);
		} catch {
			// ignore
		}
	}, []);
	const exitFullscreen = useCallback(async () => {
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			setIsFullscreen(false);
		} catch {
			// ignore
		}
	}, []);

	useEffect(() => {
		const onFull = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener("fullscreenchange", onFull);
		return () => document.removeEventListener("fullscreenchange", onFull);
	}, []);

	useEffect(() => {
		if (!drawingChannelName) return;
		const bc = new BroadcastChannel(drawingChannelName);
		const onMessage = (ev: MessageEvent) => {
			const msg = ev.data;
			if (!msg || !msg.type) return;
			if (msg.type === "presenter-drawing") {
				if (msg.active === false) {
					setExternalDrawingActive(false);
					setDrawingMode(false);
					setIsEraser(false);
					return;
				}
				if (msg.origin === "presentation") {
					setExternalDrawingActive(true);
					setDrawingMode(true);
					setIsEraser(false);
				}
			}
		};
		bc.addEventListener("message", onMessage);
		return () => {
			bc.removeEventListener("message", onMessage);
			bc.close();
		};
	}, [drawingChannelName, drawingMode]);

	useEffect(() => {
		const isTypingTarget = (t: EventTarget | null) => {
			const el = t as HTMLElement | null;
			if (!el) return false;
			const tag = el.tagName?.toLowerCase();
			if (tag === "input" || tag === "textarea" || tag === "select")
				return true;
			if (el.isContentEditable) return true;
			return false;
		};

		const onKeyDown = (e: KeyboardEvent) => {
			if (isTypingTarget(e.target)) return;

			if (drawingMode) {
				if (e.key.toLowerCase() === "d") {
					e.preventDefault();
					postPresenterDrawing(false);
					setDrawingMode(false);
					setIsEraser(false);
					return;
				}
				if (e.key.toLowerCase() === "e") {
					e.preventDefault();
					setIsEraser((p) => !p);
					return;
				}
				if (e.key === "Escape") {
					e.preventDefault();
					postPresenterDrawing(false);
					setDrawingMode(false);
					setIsEraser(false);
					return;
				}
				return;
			}

			switch (e.key) {
				case "ArrowRight":
				case " ": {
					e.preventDefault();
					onNext?.();
					break;
				}
				case "ArrowLeft": {
					e.preventDefault();
					onPrev?.();
					break;
				}
				case "m": {
					setShowNavMenu((p) => !p);
					break;
				}
				case "d": {
					setDrawingMode(true);
					setIsEraser(false);
					postPresenterDrawing(true);
					break;
				}
				case "f": {
					if (isFullscreen) void exitFullscreen();
					else void enterFullscreen();
					break;
				}
				case "Escape": {
					if (showNavMenu) setShowNavMenu(false);
					else if (isFullscreen) void exitFullscreen();
					break;
				}
			}
		};

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [
		drawingMode,
		enterFullscreen,
		exitFullscreen,
		isFullscreen,
		onNext,
		onPrev,
		postPresenterDrawing,
		showNavMenu,
	]);

	const slidesForNav = useMemo(() => {
		if (slides && slides.length > 0) return slides;
		return Array.from({ length: totalSlides }, (_, i) => ({
			id: String(i),
			type: "cover" as const,
			title: "",
		}));
	}, [slides, totalSlides]);

	return (
		<div className="fixed inset-0 bg-gray-50">
			<PresenterTopBar
				sessionNumber={sessionNumber}
				sessionDate={sessionDate}
				sessionTime={sessionTime}
				isFullscreen={isFullscreen}
				onEnterFullscreen={() => void enterFullscreen()}
				onExitFullscreen={() => void exitFullscreen()}
				drawingMode={drawingMode}
				externalDrawingActive={externalDrawingActive}
				onToggleDrawing={() => {
					if (externalDrawingActive) {
						postPresenterDrawing(false);
						setDrawingMode(false);
						setExternalDrawingActive(false);
						setIsEraser(false);
						return;
					}
					setDrawingMode((p) => {
						const next = !p;
						postPresenterDrawing(next);
						return next;
					});
					setIsEraser(false);
				}}
				showNavMenu={showNavMenu}
				onToggleNavMenu={() => setShowNavMenu((p) => !p)}
			/>

			<div className="absolute top-12 bottom-16 left-0 right-0 overflow-auto px-3 sm:px-6 py-4">
				<div className="h-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
					<PresenterSlideViewport
						currentSlide={currentSlide}
						sessionDate={sessionDate}
						sessionTime={sessionTime}
					/>
					<PresenterSidePanel
						currentSlide={currentSlide}
						nextSlide={nextSlide}
						sessionDate={sessionDate}
						sessionTime={sessionTime}
						currentSlideIndex={currentSlideIndex}
						totalSlides={totalSlides}
						sessionNumber={sessionNumber}
					/>
				</div>
			</div>

			<PresenterNavDrawer
				open={showNavMenu}
				onClose={() => setShowNavMenu(false)}
				slides={slidesForNav}
				currentSlideIndex={currentSlideIndex}
				onGoto={onGoto}
			/>

			{externalDrawingActive && !drawingMode && (
				<div className="fixed top-14 right-3 sm:right-6 bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-3 py-2 text-xs font-medium z-40">
					Drawing is active (from presentation)
				</div>
			)}

			{(drawingMode || externalDrawingActive) && (
				<DrawingCanvas
					channelName={drawingChannelName}
					active={drawingMode}
					isEraser={isEraser}
					onToggleEraser={
						drawingMode ? () => setIsEraser((p) => !p) : undefined
					}
					onClear={
						drawingMode
							? () => {
									/* noop */
								}
							: undefined
					}
					onExit={
						drawingMode
							? () => {
									postPresenterDrawing(false);
									setDrawingMode(false);
									setIsEraser(false);
								}
							: undefined
					}
					insetTop={48}
					insetBottom={64}
				/>
			)}

			<PresenterBottomBar
				slides={slidesForNav}
				currentSlide={currentSlide}
				currentSlideIndex={currentSlideIndex}
				totalSlides={totalSlides}
				onPrev={onPrev}
				onNext={onNext}
				onToggleNavMenu={() => setShowNavMenu((p) => !p)}
				onGoto={onGoto}
			/>
		</div>
	);
}
