"use client";

import type { SessionPresentationSlide } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Clock, Pencil, Timer } from "@repo/ui/lib/lucide-react";
import { getSessionTypeLabel } from "@repo/ui/lib/session-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DrawingCanvas } from "./drawing-canvas";
import {
	PresentationBottomBar,
	PresentationNavDrawer,
	PresentationTopBar,
} from "./presentation";
import {
	useAutoHideBars,
	useFullscreen,
	usePresentationDrawing,
	usePresentationPointer,
	usePresentationTimer,
	usePresenterWindow,
} from "./presentation/hooks";
import { AgendaSlide, CoverSlide } from "./slides";

interface PresentationModeProps {
	sessionNumber: string;
	sessionType: string;
	sessionDate: string;
	sessionTime: string;
	agendaItems: Array<{
		id: string;
		title: string;
		documents?: Array<{ key: string; title: string }>;
	}>;
	onExit: () => void;
}

export function PresentationMode({
	sessionNumber,
	sessionType,
	sessionDate,
	sessionTime,
	agendaItems,
	onExit,
}: PresentationModeProps) {
	const drawingChannelName = useMemo(
		() => `dali-session-${sessionNumber}`,
		[sessionNumber],
	);

	// --- Hooks ---
	const { currentTime, elapsedSeconds, formatElapsed } = usePresentationTimer();
	const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();
	const {
		presenterView,
		setPresenterView,
		presenterWindow,
		setPresenterWindow,
		presenterAckedRef,
		togglePresenterWindow,
	} = usePresenterWindow(sessionNumber, drawingChannelName);
	const {
		drawingMode,
		setDrawingMode,
		isEraser,
		setIsEraser,
		drawingController,
		setDrawingController,
		postPresentationDrawing,
		clearCanvas,
		stopDrawing,
		startDrawing,
	} = usePresentationDrawing(drawingChannelName, sessionNumber);
	const {
		pointerMode,
		setPointerMode,
		externalPointerActive,
		setExternalPointerActive,
		pointerPosition,
		setPointerPosition,
		slideAreaRef,
		handleSlidePointerMove,
		handleSlidePointerLeave,
		togglePointerMode,
		deactivatePointer,
	} = usePresentationPointer(drawingChannelName);

	// --- Slide state ---
	const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
	const [showNavMenu, setShowNavMenu] = useState(false);
	const [showExitConfirm, setShowExitConfirm] = useState(false);

	const { topBarHovered, bottomBarHovered } = useAutoHideBars({
		showNavMenu,
		drawingMode,
	});

	const slides: SessionPresentationSlide[] = useMemo(
		() => [
			{
				id: "cover",
				type: "cover",
				title: "Sangguniang Panlungsod ng Iloilo",
				subtitle: `${getSessionTypeLabel(sessionType)} #${sessionNumber}`,
			},
			...agendaItems.map((item, index) => ({
				id: item.id,
				type: "agenda-item" as const,
				title: item.title,
				agendaNumber: String(index + 1).padStart(2, "0"),
				documents: item.documents,
			})),
		],
		[agendaItems, sessionNumber, sessionType],
	);

	const currentSlide = slides[currentSlideIndex];

	const goToNextSlide = useCallback(
		() => setCurrentSlideIndex((i) => Math.min(i + 1, slides.length - 1)),
		[slides.length],
	);
	const goToPrevSlide = useCallback(
		() => setCurrentSlideIndex((i) => Math.max(i - 1, 0)),
		[],
	);
	const goToSlide = (index: number) => {
		setCurrentSlideIndex(index);
		setShowNavMenu(false);
	};

	// --- Keyboard shortcuts ---
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (showExitConfirm) {
				if (e.key === "Escape") setShowExitConfirm(false);
				return;
			}
			if (drawingMode) {
				if (e.key.toLowerCase() === "d") {
					stopDrawing();
					return;
				}
				if (e.key.toLowerCase() === "e") {
					setIsEraser((p) => !p);
					return;
				}
				return;
			}
			if (pointerMode) {
				if (e.key.toLowerCase() === "l" || e.key === "Escape") {
					deactivatePointer();
					return;
				}
				if (e.key === "ArrowRight" || e.key === " ") {
					e.preventDefault();
					goToNextSlide();
					return;
				}
				if (e.key === "ArrowLeft") {
					e.preventDefault();
					goToPrevSlide();
					return;
				}
				return;
			}
			switch (e.key) {
				case "ArrowRight":
				case " ":
					e.preventDefault();
					goToNextSlide();
					break;
				case "ArrowLeft":
					e.preventDefault();
					goToPrevSlide();
					break;
				case "f":
					if (isFullscreen) void exitFullscreen();
					else void enterFullscreen();
					break;
				case "m":
					setShowNavMenu((p) => !p);
					break;
				case "p":
					togglePresenterWindow();
					break;
				case "d":
					if (pointerMode) deactivatePointer();
					startDrawing("presentation");
					break;
				case "l":
					togglePointerMode({ drawingMode, stopDrawing });
					break;
				case "Escape":
					if (showNavMenu) setShowNavMenu(false);
					else if (isFullscreen) exitFullscreen();
					break;
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [
		goToNextSlide,
		goToPrevSlide,
		showNavMenu,
		showExitConfirm,
		drawingMode,
		pointerMode,
		stopDrawing,
		startDrawing,
		deactivatePointer,
		togglePointerMode,
		isFullscreen,
		enterFullscreen,
		exitFullscreen,
		togglePresenterWindow,
		setIsEraser,
	]);

	// --- Auto-enter fullscreen ---
	useEffect(() => {
		enterFullscreen();
	}, []);

	// --- Broadcast slide changes ---
	useEffect(() => {
		const bc = new BroadcastChannel(`dali-session-${sessionNumber}`);
		bc.postMessage({
			type: "slide",
			index: currentSlideIndex,
			slide: slides[currentSlideIndex],
			nextSlide: slides[currentSlideIndex + 1],
			totalSlides: slides.length,
			sessionDate,
			sessionTime,
		});
		bc.close();
	}, [currentSlideIndex, sessionNumber, slides, sessionDate, sessionTime]);

	// Clear drawing on slide change
	useEffect(() => {
		const bc = new BroadcastChannel(drawingChannelName);
		bc.postMessage({
			type: "drawing-clear",
			sourceId: `presentation-${sessionNumber}-slide-${currentSlideIndex}`,
		});
		bc.close();
	}, [currentSlideIndex, drawingChannelName, sessionNumber]);

	// --- Listen for control commands from presenter window ---
	useEffect(() => {
		const bc = new BroadcastChannel(`dali-session-${sessionNumber}`);
		const onMessage = (ev: MessageEvent) => {
			const msg = ev.data;
			if (!msg || !msg.type) return;

			if (msg.type === "control") {
				setPresenterView(true);
				presenterAckedRef.current = true;
				switch (msg.action) {
					case "next":
						goToNextSlide();
						break;
					case "prev":
						goToPrevSlide();
						break;
					case "goto":
						if (typeof msg.index === "number") goToSlide(msg.index);
						break;
				}
			}

			if (msg.type === "presenter-drawing") {
				if (msg.active) {
					setDrawingMode(true);
					setIsEraser(false);
					setDrawingController(
						msg.origin === "presenter" ? "presenter" : "presentation",
					);
				} else {
					setDrawingMode(false);
					setIsEraser(false);
					setDrawingController(null);
				}
			}

			if (msg.type === "presenter-window-closed") {
				setPresenterView(false);
				setPresenterWindow(null);
				presenterAckedRef.current = false;
			}

			if (msg.type === "presenter-window-opened") {
				setPresenterView(true);
				presenterAckedRef.current = true;
			}

			// Handle pointer from presenter view
			if (msg.type === "pointer-move" && msg.origin === "presenter") {
				if (pointerMode) return;
				const { x, y } = msg;
				if (x < 0 || y < 0 || x > 1 || y > 1) {
					setPointerPosition(null);
				} else {
					setPointerPosition({ x, y });
				}
			}

			if (msg.type === "pointer-active" && msg.origin === "presenter") {
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

			if (msg.type === "request-init") {
				setPresenterView(true);
				presenterAckedRef.current = true;
				if (drawingMode) {
					bc.postMessage({
						type: "presenter-drawing",
						active: true,
						origin: "presentation",
					});
				}
				if (pointerMode) {
					bc.postMessage({ type: "pointer-active", active: true });
				}
				bc.postMessage({
					type: "init",
					slide: slides[currentSlideIndex],
					index: currentSlideIndex,
					totalSlides: slides.length,
					nextSlide: slides[currentSlideIndex + 1],
					slides,
					sessionDate,
					sessionTime,
					drawingMode,
					pointerMode,
				});
			}
		};

		bc.addEventListener("message", onMessage);
		return () => {
			bc.removeEventListener("message", onMessage);
			bc.close();
		};
	}, [
		currentSlideIndex,
		drawingMode,
		pointerMode,
		slides,
		sessionNumber,
		sessionDate,
		sessionTime,
		goToNextSlide,
		goToPrevSlide,
		setPresenterView,
		setPresenterWindow,
		presenterAckedRef,
		setDrawingMode,
		setIsEraser,
		setDrawingController,
		setPointerMode,
		setPointerPosition,
		setExternalPointerActive,
	]);

	// Monitor presenter window close
	useEffect(() => {
		if (!presenterWindow) return;
		const timer = setInterval(() => {
			try {
				if (presenterWindow.closed) {
					setPresenterView(false);
					setPresenterWindow(null);
				}
			} catch {
				// ignore
			}
		}, 500);
		return () => clearInterval(timer);
	}, [presenterWindow, setPresenterView, setPresenterWindow]);

	const handleExitPresentation = async () => {
		await exitFullscreen();
		onExit();
	};

	if (!currentSlide) return null;

	return (
		<div className="fixed inset-0 w-full h-full overflow-hidden bg-white z-50">
			{/* Exit Confirmation Dialog */}
			{showExitConfirm && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100">
					<div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
						<h3 className="text-xl font-semibold text-gray-900 mb-4">
							Exit Presentation?
						</h3>
						<p className="text-gray-600 mb-6">
							Are you sure you want to exit presentation mode?
						</p>
						<div className="flex gap-3 justify-end">
							<Button
								variant="ghost"
								onClick={() => setShowExitConfirm(false)}
								className="cursor-pointer"
							>
								Cancel
							</Button>
							<Button
								variant="default"
								onClick={handleExitPresentation}
								className="bg-[#a60202] hover:bg-[#8a0101] text-white cursor-pointer"
							>
								Exit Presentation
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Top Bar */}
			<PresentationTopBar
				sessionNumber={sessionNumber}
				sessionDate={sessionDate}
				sessionTime={sessionTime}
				isFullscreen={isFullscreen}
				onEnterFullscreen={() => void enterFullscreen()}
				onExitFullscreen={() => void exitFullscreen()}
				drawingMode={drawingMode}
				isEraser={isEraser}
				isVisible={topBarHovered || showNavMenu || drawingMode}
				isController={
					drawingController === "presentation" || drawingController === null
				}
				onToggleDrawing={() => {
					if (drawingMode && drawingController === "presenter") {
						stopDrawing();
						return;
					}
					if (pointerMode) deactivatePointer();
					setDrawingMode((p) => {
						const next = !p;
						if (next) setDrawingController("presentation");
						else setDrawingController(null);
						postPresentationDrawing(next);
						return next;
					});
					setIsEraser(false);
				}}
				onToggleEraser={() => setIsEraser((p) => !p)}
				onClearCanvas={clearCanvas}
				pointerMode={pointerMode}
				externalPointerActive={externalPointerActive}
				onTogglePointer={() => togglePointerMode({ drawingMode, stopDrawing })}
				presenterView={presenterView}
				onTogglePresenter={togglePresenterWindow}
				onToggleMenu={() => setShowNavMenu(!showNavMenu)}
				onExit={() => setShowExitConfirm(true)}
				showNavMenu={showNavMenu}
			/>

			{/* Slide viewport */}
			<div
				className={`h-screen w-screen flex items-center justify-center bg-red-700 ${pointerMode ? "cursor-none" : ""}`}
			>
				<div
					ref={slideAreaRef}
					className="relative overflow-hidden"
					style={{
						aspectRatio: "16 / 9",
						width: "100%",
						maxHeight: "100%",
						maxWidth: "calc(100vh * 16 / 9)",
					}}
					onMouseMove={pointerMode ? handleSlidePointerMove : undefined}
					onMouseLeave={pointerMode ? handleSlidePointerLeave : undefined}
				>
					<div className="absolute inset-0 flex items-center justify-center">
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

					{/* Drawing Canvas */}
					{drawingMode && (
						<DrawingCanvas
							channelName={drawingChannelName}
							active={drawingController === "presentation"}
							isEraser={isEraser}
							onToggleEraser={() => setIsEraser(!isEraser)}
							onClear={() => {
								/* noop */
							}}
							onExit={stopDrawing}
							containedMode
						/>
					)}

					{/* Laser Pointer dot */}
					{(pointerMode || externalPointerActive) && pointerPosition && (
						<div
							className="absolute w-4 h-4 rounded-full bg-cyan-400/90 pointer-events-none z-50"
							style={{
								left: `${pointerPosition.x * 100}%`,
								top: `${pointerPosition.y * 100}%`,
								transform: "translate(-50%, -50%)",
								boxShadow:
									"0 0 12px 4px rgba(34, 211, 238, 0.6), 0 0 24px 8px rgba(34, 211, 238, 0.3)",
							}}
						/>
					)}
				</div>
			</div>

			{/* Bottom Bar */}
			<PresentationBottomBar
				currentSlideIndex={currentSlideIndex}
				totalSlides={slides.length}
				currentSlideTitle={
					currentSlide.type === "cover" ? "Cover" : currentSlide.title
				}
				onPrev={goToPrevSlide}
				onNext={goToNextSlide}
				onToggleMenu={() => setShowNavMenu(!showNavMenu)}
				onGoto={goToSlide}
				isVisible={bottomBarHovered || showNavMenu || drawingMode}
			/>

			{/* Persistent Timer/Clock */}
			<div className="fixed top-4 right-4 z-40 flex items-center gap-3 bg-black/70 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-white/10">
				<div className="flex items-center gap-1.5 text-sm text-white/80">
					<Timer className="h-3.5 w-3.5" />
					<span className="tabular-nums font-medium">
						{formatElapsed(elapsedSeconds)}
					</span>
				</div>
				<div className="h-4 w-px bg-white/20" />
				<div className="flex items-center gap-1.5 text-sm text-white font-medium">
					<Clock className="h-3.5 w-3.5" />
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

			{/* Navigation Drawer */}
			<PresentationNavDrawer
				open={showNavMenu}
				onClose={() => setShowNavMenu(false)}
				slides={slides}
				currentSlideIndex={currentSlideIndex}
				onGoto={goToSlide}
			/>

			{/* Keyboard Shortcuts Hint */}
			{!showNavMenu &&
				!presenterView &&
				!drawingMode &&
				!pointerMode &&
				!topBarHovered &&
				!bottomBarHovered && (
					<div className="fixed bottom-6 right-6 bg-gray-900/95 text-white text-xs px-4 py-3 rounded-lg shadow-2xl">
						<div className="space-y-1.5">
							<div className="font-semibold mb-2 text-sm">
								Keyboard Shortcuts
							</div>
							<div className="flex items-center gap-2">
								<kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">
									←
								</kbd>
								<kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">
									→
								</kbd>
								<kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">
									Space
								</kbd>
								<span>Navigate</span>
							</div>
							<div className="flex items-center gap-2">
								<kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">
									F
								</kbd>
								<span>Fullscreen</span>
							</div>
							<div className="flex items-center gap-2">
								<kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">
									M
								</kbd>
								<span>Menu</span>
								<kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">
									P
								</kbd>
								<span>Presenter</span>
							</div>
							<div className="flex items-center gap-2">
								<kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">
									D
								</kbd>
								<span>Draw</span>
								<kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">
									L
								</kbd>
								<span>Pointer</span>
							</div>
							<div className="flex items-center gap-2">
								<kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">
									ESC
								</kbd>
								<span>Exit</span>
							</div>
						</div>
					</div>
				)}

			{/* Drawing instruction bar */}
			{drawingMode && drawingController === "presentation" && (
				<div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white text-sm px-4 py-2 rounded-lg">
					<div className="flex items-center gap-3">
						<Pencil className="h-4 w-4" />
						<div className="font-semibold">Drawing Mode Active</div>
						<div className="text-xs opacity-90">
							Press{" "}
							<kbd className="px-1.5 py-0.5 bg-blue-700/50 rounded text-xs">
								D
							</kbd>{" "}
							to exit drawing •{" "}
							<kbd className="px-1.5 py-0.5 bg-blue-700/50 rounded text-xs">
								E
							</kbd>{" "}
							to toggle eraser
						</div>
					</div>
				</div>
			)}

			{/* Pointer instruction bar */}
			{pointerMode && (
				<div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-cyan-600/90 text-white text-sm px-4 py-2 rounded-lg">
					<div className="flex items-center gap-3">
						<div className="w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
						<div className="font-semibold">Laser Pointer Active</div>
						<div className="text-xs opacity-90">
							Press{" "}
							<kbd className="px-1.5 py-0.5 bg-cyan-700/50 rounded text-xs">
								L
							</kbd>{" "}
							to exit pointer
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
