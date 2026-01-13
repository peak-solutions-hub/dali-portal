"use client";

import { Button } from "@repo/ui/components/button";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Menu,
	X,
} from "@repo/ui/lib/lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DesktopOnlyGuard } from "@/components/desktop-only-guard";

interface PresentationSlide {
	id: string;
	type: "cover" | "agenda-item";
	title: string;
	subtitle?: string;
	agendaNumber?: string;
	documents?: Array<{
		key: string;
		title: string;
	}>;
}

interface PresentationModeProps {
	sessionNumber: string;
	sessionType: string;
	sessionDate: string;
	sessionTime: string;
	agendaItems: Array<{
		id: string;
		title: string;
		documents?: Array<{
			key: string;
			title: string;
		}>;
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

	// Generate slides
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

	if (!currentSlide) {
		return null;
	}

	const goToNextSlide = useCallback(() => {
		if (currentSlideIndex < slides.length - 1) {
			setCurrentSlideIndex(currentSlideIndex + 1);
		}
	}, [currentSlideIndex, slides.length]);

	const goToPrevSlide = useCallback(() => {
		if (currentSlideIndex > 0) {
			setCurrentSlideIndex(currentSlideIndex - 1);
		}
	}, [currentSlideIndex]);

	const goToSlide = (index: number) => {
		setCurrentSlideIndex(index);
		setShowNavMenu(false);
	};

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			switch (e.key) {
				case "ArrowRight":
					goToNextSlide();
					break;
				case "ArrowLeft":
					goToPrevSlide();
					break;
				case "m":
				case "M":
					setShowNavMenu((prev) => !prev);
					break;
				case "Escape":
					if (showNavMenu) {
						setShowNavMenu(false);
					} else if (isFullscreen) {
						exitFullscreen();
					} else {
						onExit();
					}
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [goToNextSlide, goToPrevSlide, showNavMenu, isFullscreen, onExit]);

	// Fullscreen handling
	const enterFullscreen = async () => {
		try {
			await document.documentElement.requestFullscreen();
			setIsFullscreen(true);
		} catch (err) {
			console.error("Error entering fullscreen:", err);
		}
	};

	const exitFullscreen = async () => {
		try {
			if (document.fullscreenElement) {
				await document.exitFullscreen();
			}
			setIsFullscreen(false);
		} catch (err) {
			console.error("Error exiting fullscreen:", err);
		}
	};

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};

		document.addEventListener("fullscreenchange", handleFullscreenChange);
		return () =>
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
	}, []);

	// Auto-enter fullscreen
	useEffect(() => {
		if (!isFullscreen) {
			enterFullscreen();
		}
	}, []);

	return (
		<DesktopOnlyGuard>
			<div className="fixed inset-0 bg-white z-50">
				{/* Top Bar */}
				<div className="fixed top-0 left-0 right-0 h-12 bg-white/95 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-6 z-50">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={onExit}
							className="gap-2 cursor-pointer"
						>
							<X className="h-4 w-4" />
							Exit Presentation
						</Button>
						<span className="text-sm text-gray-600">
							Session #{sessionNumber} • {sessionDate}
						</span>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowNavMenu(!showNavMenu)}
						className="gap-2 cursor-pointer"
					>
						<Menu className="h-4 w-4" />
						Navigation
					</Button>
				</div>

				{/* Main Content */}
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

				{/* Bottom Navigation */}
				<div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm border-t border-gray-200 flex items-center justify-center px-20 z-50">
					<div className="flex items-center justify-between w-full max-w-5xl">
						<Button
							variant="ghost"
							size="sm"
							onClick={goToPrevSlide}
							disabled={currentSlideIndex === 0}
							className="gap-2 cursor-pointer"
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

							{/* Slide Indicators */}
							<div className="flex items-center gap-2">
								{slides.map((_, index) => (
									<button
										key={index}
										type="button"
										onClick={() => goToSlide(index)}
										className={`h-2 rounded-full transition-all cursor-pointer ${
											index === currentSlideIndex
												? "w-8 bg-[#a60202]"
												: "w-2 bg-gray-300 hover:bg-gray-400"
										}`}
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
							className="gap-2 cursor-pointer"
						>
							Next
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Navigation Menu */}
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
										className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${
											index === currentSlideIndex
												? "bg-[#a60202]/10 text-[#a60202] font-medium border border-[#a60202]/20"
												: "hover:bg-gray-50 text-gray-900"
										}`}
									>
										{slide.type === "cover" ? "Cover" : slide.title}
									</button>
								))}
							</div>
						</div>

						{/* Keyboard Shortcuts */}
						<div className="p-6 border-t border-gray-200 bg-gray-50">
							<div className="text-xs text-gray-600 space-y-2">
								<div className="font-semibold mb-2">Keyboard Shortcuts:</div>
								<div className="flex justify-between">
									<span className="flex items-center gap-2">
										<kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded">
											←/→
										</kbd>
										Navigate slides
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
											ESC
										</kbd>
										Close menu
									</span>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Keyboard Shortcuts Hint (Bottom Right) */}
				{!showNavMenu && (
					<div className="fixed bottom-20 right-6 bg-gray-900/90 text-white text-xs px-3 py-2 rounded-lg">
						<div className="space-y-1">
							<div>Keyboard Shortcuts:</div>
							<div>← → Navigate • M Menu</div>
						</div>
					</div>
				)}
			</div>
		</DesktopOnlyGuard>
	);
}

function CoverSlide({
	title,
	subtitle,
	date,
	time,
}: {
	title: string;
	subtitle: string;
	date: string;
	time: string;
}) {
	return (
		<div className="text-center space-y-8 max-w-4xl">
			{/* Logo */}
			<div className="flex justify-center mb-8">
				<div className="w-32 h-32 bg-[#a60202] rounded-full flex items-center justify-center">
					<svg
						className="w-20 h-20 text-white"
						fill="currentColor"
						viewBox="0 0 24 24"
					>
						<path d="M12 2L2 7l10 5 10-5-10-5z" />
						<path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
					</svg>
				</div>
			</div>

			<h1 className="text-5xl font-bold text-gray-900">{title}</h1>
			<p className="text-3xl text-gray-700">{subtitle}</p>
			<p className="text-2xl text-gray-600">{date}</p>
			<p className="text-xl text-gray-600">{time}</p>
			<p className="text-lg text-gray-500 mt-8">
				Press → to begin or click Navigation to jump to a specific item
			</p>
		</div>
	);
}

function AgendaSlide({
	agendaNumber,
	title,
	documents,
}: {
	agendaNumber: string;
	title: string;
	documents?: Array<{
		key: string;
		title: string;
	}>;
}) {
	return (
		<div className="text-center space-y-12 max-w-4xl w-full">
			<div className="text-8xl font-bold text-gray-900">{agendaNumber}</div>
			<h2 className="text-4xl font-bold text-gray-900">{title}</h2>

			{documents && documents.length > 0 && (
				<div className="mt-16 space-y-4">
					{documents.map((doc, index) => (
						<div
							key={index}
							className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-left"
						>
							<p className="text-xl font-semibold text-gray-900 mb-2">
								{doc.key}
							</p>
							<p className="text-lg text-gray-600">{doc.title}</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
