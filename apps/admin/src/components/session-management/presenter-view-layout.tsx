"use client";

import type { SessionPresentationSlide } from "@repo/shared";
import { formatSessionDate, formatSessionTime } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Eraser,
	FileText,
	Maximize2,
	Menu,
	Minimize2,
	Minus,
	Pencil,
	Plus,
	Trash2,
	X,
} from "@repo/ui/lib/lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DrawingCanvas } from "./drawing-canvas";
import { AgendaSlide, CoverSlide } from "./slides";

function stripAgendaNumber(title: string): string {
	return title.replace(/^\d+\.?\s*[-–—]?\s*/, "");
}

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
	const [showDrawingTools, setShowDrawingTools] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [externalDrawingActive, setExternalDrawingActive] = useState(false);
	const [barsVisible, setBarsVisible] = useState(true);
	const [currentTime, setCurrentTime] = useState(new Date());
	const [notes, setNotes] = useState("");
	const [fontSize, setFontSize] = useState(14);
	const notesLimit = 5000;
	const drawingButtonRef = useRef<HTMLButtonElement>(null);

	// Current time tracker
	useEffect(() => {
		const timer = setInterval(() => setCurrentTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	// Notes storage
	const notesStorageKey = useMemo(
		() => `dali-presenter-notes-${sessionNumber ?? "unknown"}`,
		[sessionNumber],
	);
	const slideNotesKey = useMemo(
		() => currentSlide.id ?? String(currentSlideIndex),
		[currentSlide.id, currentSlideIndex],
	);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(notesStorageKey);
			const parsed: Record<string, string> = raw ? JSON.parse(raw) : {};
			setNotes((parsed[slideNotesKey] ?? "").slice(0, notesLimit));
		} catch {
			setNotes("");
		}
	}, [notesLimit, notesStorageKey, slideNotesKey]);

	const saveNotes = useCallback(
		(value: string) => {
			setNotes(value);
			try {
				const raw = localStorage.getItem(notesStorageKey);
				const parsed: Record<string, string> = raw ? JSON.parse(raw) : {};
				parsed[slideNotesKey] = value;
				localStorage.setItem(notesStorageKey, JSON.stringify(parsed));
			} catch {
				// ignore
			}
		},
		[notesStorageKey, slideNotesKey],
	);

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
	}, [drawingChannelName]);

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

	const documents = currentSlide.documents ?? [];

	const handleClearCanvas = useCallback(() => {
		// Broadcast clear to all canvases
		if (drawingChannelName) {
			const bc = new BroadcastChannel(drawingChannelName);
			bc.postMessage({
				type: "drawing-clear",
				sourceId: `presenter-${sessionNumber ?? "unknown"}-clear`,
			});
			bc.close();
		}
	}, [drawingChannelName, sessionNumber]);

	const handleCloseWindow = useCallback(() => {
		// Turn off drawing mode before closing
		if (drawingMode) {
			postPresenterDrawing(false);
			setDrawingMode(false);
			setIsEraser(false);
			setShowDrawingTools(false);
		}
		window.close();
	}, [drawingMode, postPresenterDrawing]);

	// Turn off drawing when window is closed/unloaded
	useEffect(() => {
		const handleBeforeUnload = () => {
			if (drawingMode) {
				postPresenterDrawing(false);
			}
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
			// Also cleanup on unmount
			if (drawingMode) {
				postPresenterDrawing(false);
			}
		};
	}, [drawingMode, postPresenterDrawing]);

	return (
		<div className="fixed inset-0 w-full h-full overflow-hidden bg-black flex">
			{/* Left Panel - Slide and Controls */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Top Bar - OUTSIDE slide area */}
				<div
					className={`shrink-0 h-14 bg-black/60 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-4 transition-opacity duration-300 z-50 relative ${!barsVisible ? "opacity-50" : "opacity-100"}`}
				>
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleCloseWindow}
							className="gap-1.5 cursor-pointer text-white hover:text-white hover:bg-white/20 transition-all font-medium text-xs h-8"
						>
							<X className="h-3.5 w-3.5" />
							Close
						</Button>
						<div className="h-5 w-px bg-white/20" />
						<span className="text-xs text-white/90 font-medium">
							#{sessionNumber} • {formatSessionDate(sessionDate)}
						</span>
					</div>
					<div className="flex items-center gap-1.5">
						{isFullscreen ? (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => void exitFullscreen()}
								className="cursor-pointer bg-white/10 text-white/90 hover:text-white hover:bg-white/20 transition-all h-8 text-xs"
							>
								<Minimize2 className="h-3.5 w-3.5" />
							</Button>
						) : (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => void enterFullscreen()}
								className="cursor-pointer bg-orange-500/10 text-orange-400 hover:text-white hover:bg-orange-500 transition-all h-8 text-xs"
							>
								<Maximize2 className="h-3.5 w-3.5" />
							</Button>
						)}
						<div className="relative">
							<Button
								ref={drawingButtonRef}
								variant="ghost"
								size="sm"
								onClick={() => {
									if (externalDrawingActive) {
										postPresenterDrawing(false);
										setDrawingMode(false);
										setExternalDrawingActive(false);
										setIsEraser(false);
										setShowDrawingTools(false);
										return;
									}
									if (!drawingMode) {
										setDrawingMode(true);
										setIsEraser(false);
										postPresenterDrawing(true);
										setShowDrawingTools(true);
									} else {
										setShowDrawingTools((p) => !p);
									}
								}}
								className={`cursor-pointer gap-1.5 transition-all h-8 text-xs ${drawingMode && !externalDrawingActive ? "bg-blue-500 text-white hover:bg-blue-400" : externalDrawingActive ? "bg-blue-500/40 text-blue-200 hover:bg-blue-500/60" : "bg-white/10 text-white/90 hover:text-white hover:bg-white/20"}`}
							>
								<Pencil className="h-3.5 w-3.5" />
								{drawingMode
									? externalDrawingActive
										? "Drawing (Presentation)"
										: "Drawing"
									: "Draw"}
								{drawingMode && !externalDrawingActive && (
									<ChevronDown className="h-3 w-3" />
								)}
							</Button>

							{/* Drawing Tools Dropdown - only show when presenter activated drawing */}
							{showDrawingTools && drawingMode && !externalDrawingActive && (
								<div className="absolute top-full left-0 mt-1 bg-black/95 border border-white/10 rounded-lg shadow-xl z-60 min-w-40 py-1">
									<button
										type="button"
										onClick={() => setIsEraser(false)}
										className={`w-full flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors ${!isEraser ? "bg-blue-500/20 text-blue-400" : "text-white/80 hover:bg-white/10"}`}
									>
										<Pencil className="h-3.5 w-3.5" />
										Pen
									</button>
									<button
										type="button"
										onClick={() => setIsEraser(true)}
										className={`w-full flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors ${isEraser ? "bg-blue-500/20 text-blue-400" : "text-white/80 hover:bg-white/10"}`}
									>
										<Eraser className="h-3.5 w-3.5" />
										Eraser
									</button>
									<div className="h-px bg-white/10 my-1" />
									<button
										type="button"
										onClick={handleClearCanvas}
										className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
									>
										<Trash2 className="h-3.5 w-3.5" />
										Clear All
									</button>
									<div className="h-px bg-white/10 my-1" />
									<button
										type="button"
										onClick={() => {
											postPresenterDrawing(false);
											setDrawingMode(false);
											setIsEraser(false);
											setShowDrawingTools(false);
										}}
										className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-white/10 cursor-pointer transition-colors"
									>
										<X className="h-3.5 w-3.5" />
										Exit Drawing
									</button>
								</div>
							)}
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowNavMenu((p) => !p)}
							className={`cursor-pointer gap-1.5 transition-all h-8 text-xs ${showNavMenu ? "bg-yellow-500 text-gray-900 hover:bg-yellow-400" : "bg-white/10 text-white/90 hover:text-white hover:bg-white/20"}`}
						>
							<Menu className="h-3.5 w-3.5" />
							Menu
						</Button>
					</div>
				</div>

				{/* Slide Area - 16:9 aspect ratio */}
				<div className="flex-1 flex items-center justify-center p-4 bg-black relative">
					<div
						className="relative bg-red-700 overflow-hidden"
						style={{
							aspectRatio: "16 / 9",
							width: "min(100%, calc((100% - 2rem) * 16 / 9))",
							maxHeight: "100%",
						}}
					>
						{/* Slide content */}
						<div className="absolute inset-0 flex items-center justify-center p-8">
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

						{/* Drawing Canvas - covers entire slide */}
						{(drawingMode || externalDrawingActive) && (
							<DrawingCanvas
								channelName={drawingChannelName}
								active={drawingMode}
								isEraser={isEraser}
								onToggleEraser={
									drawingMode ? () => setIsEraser((p) => !p) : undefined
								}
								onClear={drawingMode ? handleClearCanvas : undefined}
								onExit={
									drawingMode
										? () => {
												postPresenterDrawing(false);
												setDrawingMode(false);
												setIsEraser(false);
												setShowDrawingTools(false);
											}
										: undefined
								}
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
					</div>

					{/* Nav Drawer - overlays the slide area */}
					{showNavMenu && (
						<div className="absolute right-0 top-0 bottom-0 w-64 bg-black/95 backdrop-blur-md border-l border-white/10 shadow-2xl z-40 flex flex-col">
							<div className="flex items-center justify-between p-3 border-b border-white/10">
								<h3 className="text-sm font-semibold text-white">Navigation</h3>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowNavMenu(false)}
									className="cursor-pointer text-white/60 hover:text-white hover:bg-white/10 h-6 w-6 p-0"
								>
									<X className="h-3.5 w-3.5" />
								</Button>
							</div>
							<div className="flex-1 overflow-auto p-3">
								<div className="space-y-1.5">
									{slidesForNav.map((slide, index) => (
										<button
											key={slide.id}
											type="button"
											onClick={() => {
												onGoto?.(index);
												setShowNavMenu(false);
											}}
											disabled={!onGoto}
											className={`w-full text-left px-3 py-2 rounded-md transition-all cursor-pointer text-xs ${
												index === currentSlideIndex
													? "bg-yellow-500 text-gray-900 font-medium shadow-lg"
													: "bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
											}`}
										>
											<span className="block truncate">
												{slide.type === "cover"
													? "Cover"
													: stripAgendaNumber(slide.title)}
											</span>
										</button>
									))}
								</div>
							</div>
							<div className="p-3 border-t border-white/10 bg-black/30">
								<div className="text-xs text-white/50 space-y-1">
									<div className="font-semibold text-white/60">Shortcuts:</div>
									<div>←/→ Navigate • D Draw • M Menu • F Fullscreen</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Bottom Bar - OUTSIDE slide area */}
				<div
					className={`shrink-0 h-14 bg-black/60 backdrop-blur-lg border-t border-white/10 flex items-center justify-center px-4 transition-opacity duration-300 ${!barsVisible ? "opacity-50" : "opacity-100"}`}
				>
					<div className="flex items-center justify-between w-full max-w-2xl">
						<Button
							variant="ghost"
							size="sm"
							onClick={onPrev}
							disabled={!onPrev || currentSlideIndex === 0}
							className="cursor-pointer text-white/90 hover:text-white hover:bg-white/10 disabled:text-white/30 disabled:hover:bg-transparent transition-colors h-9 px-4"
						>
							<ChevronLeft className="h-4 w-4 mr-1" />
							Prev
						</Button>
						<div className="flex items-center gap-4">
							<span className="text-base font-semibold text-white min-w-16 text-center">
								{currentSlideIndex + 1} / {totalSlides}
							</span>
							<button
								type="button"
								onClick={() => setShowNavMenu((p) => !p)}
								className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-sm text-white/90 hover:text-white cursor-pointer font-medium max-w-52"
							>
								<span className="truncate">
									{currentSlide.type === "cover"
										? "Cover"
										: stripAgendaNumber(currentSlide.title)}
								</span>
								<ChevronDown className="h-4 w-4 shrink-0" />
							</button>
							<div className="flex items-center gap-1.5">
								{slidesForNav.slice(0, 8).map((_, index) => (
									<button
										key={index}
										type="button"
										onClick={() => onGoto?.(index)}
										disabled={!onGoto}
										className={`cursor-pointer h-2 rounded-full transition-all ${index === currentSlideIndex ? "w-6 bg-white" : "w-2 bg-white/30 hover:bg-white/50"}`}
										aria-label={`Go to slide ${index + 1}`}
									/>
								))}
								{slidesForNav.length > 8 && (
									<span className="text-xs text-white/50 ml-1">
										+{slidesForNav.length - 8}
									</span>
								)}
							</div>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={onNext}
							disabled={!onNext || currentSlideIndex >= totalSlides - 1}
							className="cursor-pointer text-white/90 hover:text-white hover:bg-white/10 disabled:text-white/30 disabled:hover:bg-transparent transition-colors h-9 px-4"
						>
							Next
							<ChevronRight className="h-4 w-4 ml-1" />
						</Button>
					</div>
				</div>
			</div>

			{/* Right Side Panel - Notes, Next Slide, Documents */}
			<div className="w-80 shrink-0 bg-black/60 backdrop-blur-lg border-l border-white/10 flex flex-col h-full">
				{/* Header with time */}
				<div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
					<span className="text-sm text-white/60">
						Slide {currentSlideIndex + 1} of {totalSlides}
					</span>
					<span className="text-lg font-semibold text-white">
						{currentTime.toLocaleTimeString("en-US", {
							hour: "2-digit",
							minute: "2-digit",
							hour12: true,
						})}
					</span>
				</div>

				{/* Next Slide Preview */}
				<div className="p-4 border-b border-white/10">
					<div className="text-sm text-white/60 mb-2">Next slide</div>
					{nextSlide ? (
						<div
							className="bg-red-700 rounded-lg overflow-hidden"
							style={{ aspectRatio: "16/9" }}
						>
							<div className="w-full h-full flex items-center justify-center overflow-hidden">
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
						</div>
					) : (
						<div
							className="flex items-center justify-center text-sm text-white/50 bg-white/5 rounded-lg"
							style={{ aspectRatio: "16/9" }}
						>
							End of presentation
						</div>
					)}
				</div>

				{/* Documents for discussion (if any) */}
				{documents.length > 0 && (
					<div className="p-4 border-b border-white/10">
						<div className="text-sm text-white/60 mb-2">
							Documents for Discussion
						</div>
						<div className="space-y-2 max-h-32 overflow-y-auto">
							{documents.map((doc, idx) => (
								<div
									key={idx}
									className="flex items-start gap-2 bg-white/5 rounded-lg p-2"
								>
									<FileText className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
									<div className="min-w-0">
										<div className="text-xs font-medium text-white truncate">
											{doc.key}
										</div>
										<div className="text-xs text-white/60 truncate">
											{doc.title}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Notes Section */}
				<div className="flex-1 flex flex-col min-h-0 p-4">
					<div className="text-sm text-white/60 mb-2">Speaker Notes</div>
					<textarea
						value={notes}
						onChange={(e) => {
							const value = e.target.value.slice(0, notesLimit);
							saveNotes(value);
						}}
						className="flex-1 w-full resize-none rounded-lg border border-white/10 bg-white/5 p-3 text-gray-200 outline-none focus:ring-1 focus:ring-red-500 min-h-0"
						style={{ fontSize: `${fontSize}px` }}
						placeholder="Add speaker notes for this slide…"
					/>
					<div className="mt-2 text-xs text-white/50 text-right">
						{notes.length}/{notesLimit}
					</div>
				</div>

				{/* Font size controls */}
				<div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10">
					<button
						type="button"
						onClick={() => setFontSize((s) => Math.max(10, s - 2))}
						className="flex items-center justify-center h-8 w-8 rounded bg-white/10 text-white/60 hover:text-white hover:bg-white/20 cursor-pointer"
						title="Decrease font size"
					>
						<span className="text-lg font-serif">A</span>
						<Minus className="h-2 w-2 ml-0.5" />
					</button>
					<button
						type="button"
						onClick={() => setFontSize((s) => Math.min(24, s + 2))}
						className="flex items-center justify-center h-8 w-8 rounded bg-white/10 text-white/60 hover:text-white hover:bg-white/20 cursor-pointer"
						title="Increase font size"
					>
						<span className="text-xl font-serif">A</span>
						<Plus className="h-2 w-2 ml-0.5" />
					</button>
				</div>
			</div>
		</div>
	);
}
