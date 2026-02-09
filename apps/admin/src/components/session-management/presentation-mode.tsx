"use client";

import type { SessionPresentationSlide } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Pencil } from "@repo/ui/lib/lucide-react";
import { getSessionTypeLabel } from "@repo/ui/lib/session-ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DrawingCanvas } from "./drawing-canvas";
import {
	PresentationBottomBar,
	PresentationNavDrawer,
	PresentationSlideViewport,
	PresentationTopBar,
} from "./presentation";

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
	const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
	const [showNavMenu, setShowNavMenu] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [presenterView, setPresenterView] = useState(false);
	const [presenterWindow, setPresenterWindow] = useState<Window | null>(null);
	const presenterAckedRef = useRef(false);
	const [showExitConfirm, setShowExitConfirm] = useState(false);

	// Auto-hide state for bars (hover-based)
	const [topBarHovered, setTopBarHovered] = useState(false);
	const [bottomBarHovered, setBottomBarHovered] = useState(false);
	const topBarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const bottomBarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const openPresenterWindow = useCallback(() => {
		presenterAckedRef.current = false;
		const url = `/session-presenter?session=${encodeURIComponent(sessionNumber)}`;
		console.debug("openPresenterWindow: attempting to open", url);

		// Open with 16:9 aspect ratio (1280x720)
		let w: Window | null = null;
		try {
			w = window.open(
				url,
				`dali-presenter-${sessionNumber}`,
				"noopener,noreferrer,width=1280,height=720",
			);
		} catch (err) {
			console.debug("popup open attempt failed:", err);
		}

		if (w && !w.closed) {
			setPresenterWindow(w);
			setPresenterView(true);
			presenterAckedRef.current = true;
			return;
		}

		// Try without features (sometimes less restrictive)
		try {
			w = window.open(url, `_blank`);
		} catch (err) {
			console.debug("popup open attempt without features failed:", err);
		}

		if (w && !w.closed) {
			setPresenterWindow(w);
			setPresenterView(true);
			presenterAckedRef.current = true;
			return;
		}
	}, [sessionNumber]);

	const togglePresenterWindow = useCallback(() => {
		if (document.fullscreenElement) {
			try {
				document.exitFullscreen();
			} catch {
				// ignore
			}
		}
		if (presenterWindow && !presenterWindow.closed) {
			presenterWindow.close();
			setPresenterWindow(null);
			setPresenterView(false);
			return;
		}
		if (presenterView) {
			try {
				const bc = new BroadcastChannel(drawingChannelName);
				bc.postMessage({ type: "presenter-window-close-request" });
				bc.close();
			} catch {
				// ignore
			}
			setPresenterView(false);
			setPresenterWindow(null);
			presenterAckedRef.current = false;
			return;
		}
		openPresenterWindow();
	}, [drawingChannelName, openPresenterWindow, presenterView, presenterWindow]);
	const [drawingMode, setDrawingMode] = useState(false);
	const [isEraser, setIsEraser] = useState(false);
	const [drawingController, setDrawingController] = useState<
		"presentation" | "presenter" | null
	>(null);

	const postPresentationDrawing = useCallback(
		(nextActive: boolean) => {
			const bc = new BroadcastChannel(drawingChannelName);
			bc.postMessage({
				type: "presenter-drawing",
				active: nextActive,
				origin: "presentation",
			});
			if (!nextActive) {
				bc.postMessage({
					type: "drawing-clear",
					sourceId: `presentation-${sessionNumber}-toggle-off`,
				});
			}
			bc.close();
		},
		[drawingChannelName, sessionNumber],
	);

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

	const enterFullscreen = useCallback(async () => {
		try {
			await document.documentElement.requestFullscreen();
			setIsFullscreen(true);
		} catch (err) {
			console.error(err);
		}
	}, []);
	const exitFullscreen = useCallback(async () => {
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			setIsFullscreen(false);
		} catch (err) {
			console.error(err);
		}
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (showExitConfirm) {
				if (e.key === "Escape") setShowExitConfirm(false);
				return;
			}
			if (drawingMode) {
				if (e.key.toLowerCase() === "d") {
					setDrawingMode(false);
					setIsEraser(false);
					setDrawingController(null);
					postPresentationDrawing(false);
					return;
				}
				if (e.key.toLowerCase() === "e") {
					setIsEraser((p) => !p);
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
					setDrawingMode(true);
					setIsEraser(false);
					setDrawingController("presentation");
					postPresentationDrawing(true);
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
		postPresentationDrawing,
		isFullscreen,
		enterFullscreen,
		exitFullscreen,
		togglePresenterWindow,
	]);

	const handleExitPresentation = async () => {
		await exitFullscreen();
		onExit();
	};

	useEffect(() => {
		const onFull = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener("fullscreenchange", onFull);
		return () => document.removeEventListener("fullscreenchange", onFull);
	}, []);

	useEffect(() => {
		enterFullscreen();
	}, []);

	// Track mouse position for edge detection
	useEffect(() => {
		const EDGE_THRESHOLD = 50;
		const HIDE_DELAY = 1000; // 1 seconds

		const handleMouseMove = (e: MouseEvent) => {
			const windowHeight = window.innerHeight;

			// Top bar logic
			if (e.clientY <= EDGE_THRESHOLD) {
				// Clear any pending hide timeout
				if (topBarTimeoutRef.current) {
					clearTimeout(topBarTimeoutRef.current);
					topBarTimeoutRef.current = null;
				}
				setTopBarHovered(true);
			} else if (
				e.clientY > EDGE_THRESHOLD + 10 &&
				!showNavMenu &&
				!drawingMode
			) {
				// Add 10px buffer to prevent flickering
				if (topBarTimeoutRef.current) {
					clearTimeout(topBarTimeoutRef.current);
				}
				topBarTimeoutRef.current = setTimeout(() => {
					setTopBarHovered(false);
				}, HIDE_DELAY);
			}

			// Bottom bar logic
			if (e.clientY >= windowHeight - EDGE_THRESHOLD) {
				if (bottomBarTimeoutRef.current) {
					clearTimeout(bottomBarTimeoutRef.current);
					bottomBarTimeoutRef.current = null;
				}
				setBottomBarHovered(true);
			} else if (
				e.clientY < windowHeight - EDGE_THRESHOLD - 10 &&
				!showNavMenu &&
				!drawingMode
			) {
				// Add 10px buffer to prevent flickering
				if (bottomBarTimeoutRef.current) {
					clearTimeout(bottomBarTimeoutRef.current);
				}
				bottomBarTimeoutRef.current = setTimeout(() => {
					setBottomBarHovered(false);
				}, HIDE_DELAY);
			}
		};

		document.addEventListener("mousemove", handleMouseMove);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			// Clean up timeouts
			if (topBarTimeoutRef.current) {
				clearTimeout(topBarTimeoutRef.current);
			}
			if (bottomBarTimeoutRef.current) {
				clearTimeout(bottomBarTimeoutRef.current);
			}
		};
	}, [showNavMenu, drawingMode]);

	// Broadcast each slide change
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

	useEffect(() => {
		const bc = new BroadcastChannel(drawingChannelName);
		bc.postMessage({
			type: "drawing-clear",
			sourceId: `presentation-${sessionNumber}-slide-${currentSlideIndex}`,
		});
		bc.close();
	}, [currentSlideIndex, drawingChannelName, sessionNumber]);

	// Listen for control commands from presenter window and for init requests
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

			if (msg.type === "request-init") {
				setPresenterView(true);
				presenterAckedRef.current = true;
				// Send drawing state first
				if (drawingMode) {
					bc.postMessage({
						type: "presenter-drawing",
						active: true,
						origin: "presentation",
					});
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
		slides,
		sessionNumber,
		sessionDate,
		sessionTime,
		goToNextSlide,
		goToPrevSlide,
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
				// ignore cross-origin or other access errors
			}
		}, 500);
		return () => clearInterval(timer);
	}, [presenterWindow]);

	if (!currentSlide) return null;

	return (
		<div className="fixed inset-0 w-full h-full overflow-hidden bg-white z-50">
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
						setDrawingMode(false);
						setIsEraser(false);
						setDrawingController(null);
						postPresentationDrawing(false);
						return;
					}

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
				onClearCanvas={() => {
					const bc = new BroadcastChannel(drawingChannelName);
					bc.postMessage({
						type: "drawing-clear",
						sourceId: `presentation-${sessionNumber}-clear`,
					});
					bc.close();
				}}
				presenterView={presenterView}
				onTogglePresenter={togglePresenterWindow}
				onToggleMenu={() => setShowNavMenu(!showNavMenu)}
				onExit={() => setShowExitConfirm(true)}
				showNavMenu={showNavMenu}
			/>

			<PresentationSlideViewport
				slide={currentSlide}
				sessionDate={sessionDate}
				sessionTime={sessionTime}
			/>

			{drawingMode && (
				<DrawingCanvas
					channelName={drawingChannelName}
					active={drawingController === "presentation"}
					isEraser={isEraser}
					onToggleEraser={() => setIsEraser(!isEraser)}
					onClear={() => {
						/* noop */
					}}
					onExit={() => {
						setDrawingMode(false);
						setIsEraser(false);
						setDrawingController(null);
						postPresentationDrawing(false);
					}}
					insetTop={56}
					insetBottom={64}
				/>
			)}

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

			<PresentationNavDrawer
				open={showNavMenu}
				onClose={() => setShowNavMenu(false)}
				slides={slides}
				currentSlideIndex={currentSlideIndex}
				onGoto={goToSlide}
			/>

			{!showNavMenu &&
				!presenterView &&
				!drawingMode &&
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
									ESC
								</kbd>
								<span>Exit</span>
							</div>
						</div>
					</div>
				)}

			{drawingMode && (
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
		</div>
	);
}
