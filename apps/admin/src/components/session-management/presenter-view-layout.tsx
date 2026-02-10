"use client";

import type { SessionPresentationSlide } from "@repo/shared";
import { Clock, Pencil, Timer } from "@repo/ui/lib/lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DrawingCanvas } from "./drawing-canvas";
import { useFullscreen, usePresentationTimer } from "./presentation/hooks";
import {
	PresenterBottomBar,
	PresenterNavDrawer,
	PresenterSidePanel,
	PresenterTopBar,
} from "./presenter";
import {
	usePresenterDrawing,
	usePresenterNotes,
	usePresenterPointer,
} from "./presenter/hooks";
import { AgendaSlide, CoverSlide } from "./slides";

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
	const drawingChannelName = useMemo(() => {
		if (!sessionNumber) return undefined;
		return `dali-session-${sessionNumber}`;
	}, [sessionNumber]);

	// --- Hooks ---
	const { currentTime, elapsedSeconds, formatElapsed } = usePresentationTimer();
	const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();
	const {
		drawingMode,
		setDrawingMode,
		isEraser,
		setIsEraser,
		showDrawingTools,
		setShowDrawingTools,
		externalDrawingActive,
		setExternalDrawingActive,
		drawingButtonRef,
		postPresenterDrawing,
		clearCanvas,
		stopDrawing,
		startDrawing,
	} = usePresenterDrawing(drawingChannelName, sessionNumber);
	const {
		pointerMode,
		setPointerMode,
		externalPointerActive,
		setExternalPointerActive,
		pointerPosition,
		setPointerPosition,
		slideContainerRef,
		handlePresenterPointerMove,
		handlePresenterPointerLeave,
		togglePresenterPointerMode,
		deactivatePointer,
	} = usePresenterPointer(drawingChannelName);

	const slideNotesKey = useMemo(
		() => currentSlide.id ?? String(currentSlideIndex),
		[currentSlide.id, currentSlideIndex],
	);
	const { notes, saveNotes, notesLimit } = usePresenterNotes(
		sessionNumber,
		slideNotesKey,
	);

	const [showNavMenu, setShowNavMenu] = useState(false);
	const [barsVisible, setBarsVisible] = useState(true);

	// Dynamic slide scale
	useEffect(() => {
		const el = slideContainerRef.current;
		if (!el) return;
		const update = () => {
			const w = el.clientWidth;
			const h = el.clientHeight;
			const scale = Math.min(w / 1920, h / 1080);
			el.style.setProperty("--slide-scale", String(scale));
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	}, [slideContainerRef]);

	// --- BroadcastChannel listener ---
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
			if (msg.type === "pointer-move") {
				if (pointerMode) return;
				const { x, y } = msg;
				if (x < 0 || y < 0 || x > 1 || y > 1) {
					setPointerPosition(null);
				} else {
					setPointerPosition({ x, y });
				}
			}
			if (msg.type === "pointer-active") {
				if (msg.origin === "presenter") return;
				if (msg.active) {
					if (pointerMode) {
						setPointerMode(false);
						setPointerPosition(null);
					}
					setExternalPointerActive(true);
				} else {
					if (pointerMode) {
						setPointerMode(false);
						setPointerPosition(null);
					}
					setExternalPointerActive(false);
					setPointerPosition(null);
				}
			}
		};
		bc.addEventListener("message", onMessage);
		return () => {
			bc.removeEventListener("message", onMessage);
			bc.close();
		};
	}, [
		drawingChannelName,
		pointerMode,
		setDrawingMode,
		setIsEraser,
		setExternalDrawingActive,
		setPointerMode,
		setPointerPosition,
		setExternalPointerActive,
	]);

	// Auto-hide bars
	useEffect(() => {
		if (showNavMenu || drawingMode) {
			setBarsVisible(true);
			return;
		}
		let timeout: ReturnType<typeof setTimeout>;
		const showBars = () => {
			setBarsVisible(true);
			clearTimeout(timeout);
			timeout = setTimeout(() => setBarsVisible(false), 3000);
		};
		showBars();
		window.addEventListener("mousemove", showBars);
		window.addEventListener("click", showBars);
		return () => {
			clearTimeout(timeout);
			window.removeEventListener("mousemove", showBars);
			window.removeEventListener("click", showBars);
		};
	}, [showNavMenu, drawingMode]);

	// --- Keyboard shortcuts ---
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
					stopDrawing();
					return;
				}
				if (e.key.toLowerCase() === "e") {
					e.preventDefault();
					setIsEraser((p) => !p);
					return;
				}
				if (e.key === "Escape") {
					e.preventDefault();
					stopDrawing();
					return;
				}
				return;
			}

			if (pointerMode) {
				if (e.key.toLowerCase() === "l" || e.key === "Escape") {
					e.preventDefault();
					togglePresenterPointerMode({ drawingMode, stopDrawing });
					return;
				}
				if (e.key === "ArrowRight" || e.key === " ") {
					e.preventDefault();
					onNext?.();
					return;
				}
				if (e.key === "ArrowLeft") {
					e.preventDefault();
					onPrev?.();
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
					if (pointerMode) deactivatePointer();
					startDrawing();
					break;
				}
				case "l": {
					togglePresenterPointerMode({ drawingMode, stopDrawing });
					break;
				}
				case "f": {
					if (isFullscreen) void exitFullscreen();
					else void enterFullscreen();
					break;
				}
				case "Escape": {
					if (showNavMenu) setShowNavMenu(false);
					else if (isFullscreen) {
						e.preventDefault();
						void exitFullscreen();
					}
					break;
				}
			}
		};

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [
		drawingMode,
		pointerMode,
		enterFullscreen,
		exitFullscreen,
		isFullscreen,
		onNext,
		onPrev,
		stopDrawing,
		startDrawing,
		togglePresenterPointerMode,
		deactivatePointer,
		showNavMenu,
		setIsEraser,
	]);

	// Cleanup on window close
	const handleCloseWindow = useCallback(() => {
		if (drawingMode) stopDrawing();
		if (pointerMode) deactivatePointer();
		window.close();
	}, [drawingMode, pointerMode, stopDrawing, deactivatePointer]);

	useEffect(() => {
		const handleBeforeUnload = () => {
			if (drawingMode) postPresenterDrawing(false);
			if (pointerMode && drawingChannelName) {
				const bc = new BroadcastChannel(drawingChannelName);
				bc.postMessage({
					type: "pointer-active",
					active: false,
					origin: "presenter",
				});
				bc.close();
			}
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
			if (drawingMode) postPresenterDrawing(false);
			if (pointerMode && drawingChannelName) {
				const bc = new BroadcastChannel(drawingChannelName);
				bc.postMessage({
					type: "pointer-active",
					active: false,
					origin: "presenter",
				});
				bc.close();
			}
		};
	}, [drawingMode, pointerMode, postPresenterDrawing, drawingChannelName]);

	const slidesForNav = useMemo(() => {
		if (slides && slides.length > 0) return slides;
		return Array.from({ length: totalSlides }, (_, i) => ({
			id: String(i),
			type: "cover" as const,
			title: "",
		}));
	}, [slides, totalSlides]);

	return (
		<div className="fixed inset-0 w-full h-full overflow-hidden bg-black flex">
			{/* Left Panel - Slide and Controls */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Top Bar */}
				<PresenterTopBar
					sessionNumber={sessionNumber}
					sessionDate={sessionDate}
					isFullscreen={isFullscreen}
					barsVisible={barsVisible}
					onEnterFullscreen={() => void enterFullscreen()}
					onExitFullscreen={() => void exitFullscreen()}
					onCloseWindow={handleCloseWindow}
					drawingMode={drawingMode}
					externalDrawingActive={externalDrawingActive}
					isEraser={isEraser}
					showDrawingTools={showDrawingTools}
					drawingButtonRef={drawingButtonRef}
					onToggleDrawing={() => {
						if (externalDrawingActive) {
							postPresenterDrawing(false);
							setDrawingMode(false);
							setExternalDrawingActive(false);
							setIsEraser(false);
							setShowDrawingTools(false);
							return;
						}
						if (!drawingMode) {
							if (pointerMode) deactivatePointer();
							startDrawing();
						} else {
							setShowDrawingTools((p) => !p);
						}
					}}
					onSetEraser={setIsEraser}
					onClearCanvas={clearCanvas}
					onExitDrawing={stopDrawing}
					onToggleDrawingTools={() => setShowDrawingTools((p) => !p)}
					pointerMode={pointerMode}
					externalPointerActive={externalPointerActive}
					onTogglePointer={() =>
						togglePresenterPointerMode({ drawingMode, stopDrawing })
					}
					showNavMenu={showNavMenu}
					onToggleMenu={() => setShowNavMenu((p) => !p)}
				/>

				{/* Slide Area - 16:9 aspect ratio */}
				<div className="flex-1 flex items-center justify-center p-4 bg-black relative">
					{/* Persistent Timer/Clock */}
					<div className="absolute top-6 right-6 z-30 flex items-center gap-2.5 bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg border border-white/10">
						<div className="flex items-center gap-1.5 text-xs text-white/80">
							<Timer className="h-3 w-3" />
							<span className="tabular-nums font-medium">
								{formatElapsed(elapsedSeconds)}
							</span>
						</div>
						<div className="h-3.5 w-px bg-white/20" />
						<div className="flex items-center gap-1.5 text-xs text-white font-medium">
							<Clock className="h-3 w-3" />
							<span className="tabular-nums">
								{currentTime.toLocaleTimeString("en-US", {
									hour: "2-digit",
									minute: "2-digit",
									second: "2-digit",
									hour12: true,
									timeZone: "Asia/Manila",
								})}
							</span>
						</div>
					</div>

					<div
						ref={slideContainerRef}
						className={`relative bg-red-700 overflow-hidden ${pointerMode ? "cursor-none" : ""}`}
						style={{
							aspectRatio: "16 / 9",
							width: "100%",
							maxHeight: "100%",
							maxWidth: "calc((100vh - 7rem) * 16 / 9)",
						}}
						onMouseMove={pointerMode ? handlePresenterPointerMove : undefined}
						onMouseLeave={pointerMode ? handlePresenterPointerLeave : undefined}
					>
						{/* Slide content — scaled */}
						<div className="absolute inset-0 flex items-center justify-center overflow-hidden">
							<div
								className="w-480 h-270 origin-center flex items-center justify-center"
								style={{
									transform: "scale(var(--slide-scale, 0.5))",
								}}
							>
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

						{/* Drawing Canvas */}
						{(drawingMode || externalDrawingActive) && (
							<DrawingCanvas
								channelName={drawingChannelName}
								active={drawingMode}
								isEraser={isEraser}
								onToggleEraser={
									drawingMode ? () => setIsEraser((p) => !p) : undefined
								}
								onClear={drawingMode ? clearCanvas : undefined}
								onExit={drawingMode ? stopDrawing : undefined}
								insetTop={0}
								insetBottom={0}
								insetLeft={0}
								insetRight={0}
								containedMode={true}
							/>
						)}

						{externalDrawingActive && !drawingMode && (
							<div className="absolute top-3 left-3 bg-blue-500/90 text-white rounded-md px-2 py-1 text-xs font-medium z-10">
								Drawing active (from presentation)
							</div>
						)}

						{/* Laser Pointer dot */}
						{(pointerMode || externalPointerActive) && pointerPosition && (
							<div
								className="absolute w-3 h-3 rounded-full bg-cyan-400/90 pointer-events-none z-50"
								style={{
									left: `${pointerPosition.x * 100}%`,
									top: `${pointerPosition.y * 100}%`,
									transform: "translate(-50%, -50%)",
									boxShadow:
										"0 0 8px 3px rgba(34, 211, 238, 0.6), 0 0 16px 6px rgba(34, 211, 238, 0.3)",
								}}
							/>
						)}
					</div>

					{/* Nav Drawer */}
					<PresenterNavDrawer
						open={showNavMenu}
						onClose={() => setShowNavMenu(false)}
						slides={slidesForNav}
						currentSlideIndex={currentSlideIndex}
						onGoto={onGoto}
					/>

					{/* Drawing info bar overlay */}
					{drawingMode && !externalDrawingActive && (
						<div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-blue-600/90 text-white text-xs px-4 py-1.5 rounded-lg flex items-center gap-3 shadow-lg">
							<Pencil className="h-3.5 w-3.5" />
							<span className="font-semibold">Drawing Mode Active</span>
							<span className="opacity-80">
								Press{" "}
								<kbd className="px-1 py-0.5 bg-blue-700/50 rounded text-[10px]">
									D
								</kbd>{" "}
								to exit •{" "}
								<kbd className="px-1 py-0.5 bg-blue-700/50 rounded text-[10px]">
									E
								</kbd>{" "}
								toggle eraser
							</span>
						</div>
					)}

					{/* Pointer info bar overlay */}
					{pointerMode && (
						<div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-cyan-600/90 text-white text-xs px-4 py-1.5 rounded-lg flex items-center gap-3 shadow-lg">
							<div className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(103,232,249,0.8)]" />
							<span className="font-semibold">Laser Pointer Active</span>
							<span className="opacity-80">
								Press{" "}
								<kbd className="px-1 py-0.5 bg-cyan-700/50 rounded text-[10px]">
									L
								</kbd>{" "}
								to exit
							</span>
						</div>
					)}
				</div>

				{/* Bottom Bar */}
				<PresenterBottomBar
					currentSlideIndex={currentSlideIndex}
					totalSlides={totalSlides}
					currentSlide={currentSlide}
					slides={slidesForNav}
					barsVisible={barsVisible}
					onPrev={onPrev}
					onNext={onNext}
					onGoto={onGoto}
					onToggleMenu={() => setShowNavMenu((p) => !p)}
				/>
			</div>

			{/* Right Side Panel */}
			<PresenterSidePanel
				currentSlideIndex={currentSlideIndex}
				totalSlides={totalSlides}
				currentSlide={currentSlide}
				nextSlide={nextSlide}
				sessionDate={sessionDate}
				sessionTime={sessionTime}
				currentTime={currentTime}
				elapsedSeconds={elapsedSeconds}
				formatElapsed={formatElapsed}
				notes={notes}
				notesLimit={notesLimit}
				onSaveNotes={saveNotes}
			/>
		</div>
	);
}
