"use client";

import { formatSessionDate, formatSessionTime } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Eye,
	Menu,
	Monitor,
	Pencil,
	X,
} from "@repo/ui/lib/lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DesktopOnlyGuard } from "@/components/desktop-only-guard";
import { DrawingCanvas } from "./drawing-canvas";
import { PresenterViewLayout } from "./presenter-view-layout";
import { AgendaSlide, CoverSlide } from "./slides";

interface PresentationSlide {
	id: string;
	type: "cover" | "agenda-item";
	title: string;
	subtitle?: string;
	agendaNumber?: string;
	documents?: Array<{ key: string; title: string }>;
}

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
	const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
	const [showNavMenu, setShowNavMenu] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [presenterView, setPresenterView] = useState(false);
	const [presenterWindow, setPresenterWindow] = useState<Window | null>(null);
	const [presenterOpenError, setPresenterOpenError] = useState<string | null>(
		null,
	);
	const [showExitConfirm, setShowExitConfirm] = useState(false);

	const openPresenterWindow = () => {
		const url = `/session-presenter?session=${encodeURIComponent(sessionNumber)}`;
		console.debug("openPresenterWindow: attempting to open", url);

		// Try with features first (some blockers allow opening without features)
		let w: Window | null = null;
		try {
			w = window.open(
				url,
				`dali-presenter-${sessionNumber}`,
				"noopener,noreferrer,width=1200,height=900",
			);
		} catch (err) {
			console.debug("popup open attempt failed:", err);
		}

		if (w && !w.closed) {
			setPresenterWindow(w);
			setPresenterView(true);
			setPresenterOpenError(null);
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
			setPresenterOpenError(null);
			return;
		}

		// Popup was blocked
		setPresenterOpenError(
			"Popup blocked. Allow popups or open presenter in a new tab.",
		);
	};
	const [drawingMode, setDrawingMode] = useState(false);
	const [isEraser, setIsEraser] = useState(false);

	const slides: PresentationSlide[] = [
		{
			id: "cover",
			type: "cover",
			title: "Sangguniang Panlungsod ng Iloilo",
			subtitle: `${sessionType} Session #${sessionNumber}`,
		},
		...agendaItems.map((item, index) => ({
			id: item.id,
			type: "agenda-item" as const,
			title: item.title,
			agendaNumber: String(index + 1).padStart(2, "0"),
			documents: item.documents,
		})),
	];

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
				case "m":
					setShowNavMenu((p) => !p);
					break;
				case "p":
					setPresenterView((p) => !p);
					break;
				case "d":
					setDrawingMode(true);
					setIsEraser(false);
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
		isFullscreen,
	]);

	const enterFullscreen = async () => {
		try {
			await document.documentElement.requestFullscreen();
			setIsFullscreen(true);
		} catch (err) {
			console.error(err);
		}
	};
	const exitFullscreen = async () => {
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			setIsFullscreen(false);
		} catch (err) {
			console.error(err);
		}
	};
	const handleExitPresentation = async () => {
		await exitFullscreen();
		onExit();
	};
	const handleRejoinFullscreen = async () => {
		await enterFullscreen();
	};

	useEffect(() => {
		const onFull = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener("fullscreenchange", onFull);
		return () => document.removeEventListener("fullscreenchange", onFull);
	}, []);

	useEffect(() => {
		enterFullscreen();
	}, []);

	// BroadcastChannel: sync presenter -> display window
	useEffect(() => {
		let bc: BroadcastChannel | null = null;
		if (presenterView) {
			bc = new BroadcastChannel(`dali-session-${sessionNumber}`);
			bc.postMessage({ type: "init", slide: slides[currentSlideIndex] });
		}
		return () => {
			if (bc) bc.close();
		};
	}, [presenterView, sessionNumber]);

	// Broadcast each slide change while in presenter view
	useEffect(() => {
		if (!presenterView) return;
		const bc = new BroadcastChannel(`dali-session-${sessionNumber}`);
		bc.postMessage({
			type: "slide",
			index: currentSlideIndex,
			slide: slides[currentSlideIndex],
		});
		bc.close();
	}, [currentSlideIndex, presenterView, sessionNumber, slides]);

	// Listen for control commands from presenter window and for init requests
	useEffect(() => {
		const bc = new BroadcastChannel(`dali-session-${sessionNumber}`);
		const onMessage = (ev: MessageEvent) => {
			const msg = ev.data;
			if (!msg || !msg.type) return;

			if (msg.type === "control") {
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

			if (msg.type === "request-init") {
				bc.postMessage({
					type: "init",
					slide: slides[currentSlideIndex],
					index: currentSlideIndex,
					totalSlides: slides.length,
					nextSlide: slides[currentSlideIndex + 1],
					sessionDate,
					sessionTime,
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
		<DesktopOnlyGuard>
			<div className="fixed inset-0 bg-white z-50">
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
								>
									Cancel
								</Button>
								<Button
									variant="default"
									onClick={handleExitPresentation}
									className="bg-[#a60202] hover:bg-[#8a0101] text-white"
								>
									Exit Presentation
								</Button>
							</div>
						</div>
					</div>
				)}

				<div className="fixed top-0 left-0 right-0 h-12 bg-white/95 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-6 z-50">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowExitConfirm(true)}
							className="gap-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
						>
							<X className="h-4 w-4" />
							Exit Presentation
						</Button>
						<div className="h-6 w-px bg-gray-300" />
						<span className="text-sm text-gray-600">
							Session #{sessionNumber} • {formatSessionDate(sessionDate)} •{" "}
							{formatSessionTime(`${sessionDate}T${sessionTime}`)}
						</span>
					</div>
					<div className="flex items-center gap-2">
						{isFullscreen ? (
							<Button variant="ghost" size="sm" onClick={exitFullscreen}>
								<Monitor className="h-4 w-4" />
								Exit Fullscreen
							</Button>
						) : (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleRejoinFullscreen}
								className="text-[#a60202] hover:text-[#8a0101] hover:bg-[#a60202]/10"
							>
								<Monitor className="h-4 w-4" />
								Enter Fullscreen
							</Button>
						)}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setDrawingMode(!drawingMode);
								setIsEraser(false);
							}}
							className={`gap-2 ${drawingMode ? "bg-blue-100 text-blue-600" : "text-gray-700"}`}
						>
							<Pencil className="h-4 w-4" />
							{drawingMode ? "Drawing..." : "Draw"}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								if (presenterWindow && !presenterWindow.closed) {
									presenterWindow.close();
									setPresenterWindow(null);
									setPresenterView(false);
									setPresenterOpenError(null);
									return;
								}
								openPresenterWindow();
							}}
							className={`gap-2 ${presenterView ? "bg-[#a60202]/10 text-[#a60202]" : "text-gray-700"}`}
						>
							<Eye className="h-4 w-4" />
							Presenter
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowNavMenu(!showNavMenu)}
						>
							<Menu className="h-4 w-4" />
							Menu
						</Button>
					</div>
				</div>

				<div className="h-screen flex items-center justify-center p-20">
					{currentSlide.type === "cover" ? (
						<CoverSlide
							title={currentSlide.title}
							subtitle={currentSlide.subtitle!}
							date={sessionDate}
							time={sessionTime}
						/>
					) : (
						<AgendaSlide
							agendaNumber={currentSlide.agendaNumber!}
							title={currentSlide.title}
							documents={currentSlide.documents}
						/>
					)}
				</div>

				{drawingMode && (
					<DrawingCanvas
						isEraser={isEraser}
						onToggleEraser={() => setIsEraser(!isEraser)}
						onClear={() => {
							/* noop */
						}}
						onExit={() => {
							setDrawingMode(false);
							setIsEraser(false);
						}}
					/>
				)}

				<div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm border-t border-gray-200 flex items-center justify-center px-20 z-50">
					<div className="flex items-center justify-between w-full max-w-5xl">
						<Button
							variant="ghost"
							size="sm"
							onClick={goToPrevSlide}
							disabled={currentSlideIndex === 0}
						>
							<ChevronLeft className="h-4 w-4" />
							Previous
						</Button>
						<div className="flex items-center gap-4">
							<span className="text-lg font-medium text-gray-900">
								{currentSlideIndex + 1} / {slides.length}
							</span>
							<button
								type="button"
								onClick={() => setShowNavMenu(!showNavMenu)}
								className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors text-sm text-gray-900 cursor-pointer"
							>
								<span>
									{currentSlide.type === "cover" ? "Cover" : currentSlide.title}
								</span>
								<ChevronDown className="h-4 w-4" />
							</button>
							<div className="flex items-center gap-2">
								{slides.map((_, index) => (
									<button
										key={index}
										type="button"
										onClick={() => goToSlide(index)}
										className={`h-2 rounded-full transition-all ${index === currentSlideIndex ? "w-8 bg-[#a60202]" : "w-2 bg-gray-300 hover:bg-gray-400"}`}
										aria-label={`Go to slide ${index + 1}`}
									/>
								))}
							</div>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={goToNextSlide}
							disabled={currentSlideIndex === slides.length - 1}
						>
							Next
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{showNavMenu && (
					<div className="fixed right-0 top-12 bottom-16 w-96 bg-white border-l border-gray-200 shadow-2xl z-40 flex flex-col">
						<div className="flex items-center justify-between p-6 border-b border-gray-200">
							<h3 className="text-lg font-semibold text-gray-900">
								Session Navigation
							</h3>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowNavMenu(false)}
								className="cursor-pointer"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
						<div className="flex-1 overflow-y-auto p-4">
							<div className="space-y-2">
								{slides.map((slide, index) => (
									<button
										key={slide.id}
										type="button"
										onClick={() => goToSlide(index)}
										className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${index === currentSlideIndex ? "bg-[#a60202]/10 text-[#a60202] font-medium border border-[#a60202]/20" : "hover:bg-gray-50 text-gray-900"}`}
									>
										<div className="flex items-start gap-3">
											<span className="text-xs text-gray-500 mt-0.5">
												{index + 1}
											</span>
											<span className="flex-1">
												{slide.type === "cover" ? "Cover" : slide.title}
											</span>
										</div>
									</button>
								))}
							</div>
						</div>
						<div className="p-6 border-t border-gray-200 bg-gray-50">
							<div className="text-xs text-gray-600 space-y-2">
								<div className="font-semibold mb-2">Keyboard Shortcuts:</div>
								<div className="flex justify-between">
									<span className="flex items-center gap-2">
										<kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded">
											←/→/Space
										</kbd>
										Navigate
									</span>
								</div>
								<div className="flex justify-between">
									<span className="flex items-center gap-2">
										<kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded">
											D
										</kbd>
										Toggle drawing
									</span>
								</div>
								<div className="flex justify-between">
									<span className="flex items-center gap-2">
										<kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded">
											E
										</kbd>
										Toggle eraser
									</span>
								</div>
								<div className="flex justify-between">
									<span className="flex items-center gap-2">
										<kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded">
											M
										</kbd>
										Toggle menu
									</span>
								</div>
								<div className="flex justify-between">
									<span className="flex items-center gap-2">
										<kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded">
											P
										</kbd>
										Presenter view
									</span>
								</div>
								<div className="flex justify-between">
									<span className="flex items-center gap-2">
										<kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded">
											ESC
										</kbd>
										Exit fullscreen
									</span>
								</div>
							</div>
						</div>
					</div>
				)}

				{presenterOpenError && (
					<div className="fixed top-14 right-6 z-60 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded shadow-sm">
						<div className="flex items-center gap-3">
							<div className="text-sm">{presenterOpenError}</div>
							<div className="ml-2 flex gap-2">
								<button
									className="px-2 py-1 bg-yellow-100 rounded"
									onClick={() => {
										setPresenterOpenError(null);
										openPresenterWindow();
									}}
								>
									Try again
								</button>
								<button
									className="px-2 py-1 bg-gray-50 rounded"
									onClick={() =>
										window.location.assign(
											`/session-presenter?session=${encodeURIComponent(sessionNumber)}`,
										)
									}
								>
									Open in same tab
								</button>
							</div>
							<button
								className="ml-2 text-xs"
								onClick={() => setPresenterOpenError(null)}
							>
								Dismiss
							</button>
						</div>
					</div>
				)}

				{!showNavMenu && !presenterView && !drawingMode && (
					<div className="fixed bottom-20 right-6 bg-gray-900/90 text-white text-xs px-3 py-2 rounded-lg">
						<div className="space-y-1">
							<div className="font-semibold mb-1">Keyboard Shortcuts:</div>
							<div>← → Space: Navigate</div>
							<div>D: Toggle Draw • M: Menu • P: Presenter</div>
							<div>ESC: Exit Fullscreen</div>
						</div>
					</div>
				)}

				{drawingMode && (
					<div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white text-sm px-4 py-2 rounded-lg">
						<div className="flex items-center gap-3">
							<Pencil className="h-4 w-4" />
							<div className="font-semibold">Drawing Mode Active</div>
							<div className="text-xs opacity-90">
								Press D to exit • E to toggle eraser
							</div>
						</div>
					</div>
				)}
			</div>
		</DesktopOnlyGuard>
	);
}
