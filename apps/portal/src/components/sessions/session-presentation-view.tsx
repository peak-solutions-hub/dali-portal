"use client";

import {
	formatSessionDate,
	formatSessionTime,
	type SessionWithAgenda,
} from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	ChevronLeft,
	ChevronRight,
	FileText,
	LogOut,
	Menu,
	X,
} from "@repo/ui/lib/lucide-react";
import {
	getClassificationLabel,
	getDocumentTypeBadgeClass,
	getSectionLabel,
	getSectionLetter,
	getSessionTypeLabel,
	SESSION_SECTION_ORDER,
} from "@repo/ui/lib/session-ui";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface SessionPresentationViewProps {
	session: SessionWithAgenda;
	onExitPresentation?: () => void;
}

interface Slide {
	type: "cover" | "section";
	sectionKey?: string;
	letter?: string;
	label?: string;
	items?: SessionWithAgenda["agendaItems"];
}

export function SessionPresentationView({
	session,
	onExitPresentation,
}: SessionPresentationViewProps) {
	const [currentSlide, setCurrentSlide] = useState(0);
	const [isNavOpen, setIsNavOpen] = useState(false);

	// Build slides: cover + one per section
	const slides: Slide[] = [
		{ type: "cover" },
		...SESSION_SECTION_ORDER.map((key) => ({
			type: "section" as const,
			sectionKey: key,
			letter: getSectionLetter(key),
			label: getSectionLabel(key),
			items: session.agendaItems.filter((item) => item.section === key),
		})),
	];

	const totalSlides = slides.length;

	const goNext = useCallback(() => {
		setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
	}, [totalSlides]);

	const goPrev = useCallback(() => {
		setCurrentSlide((prev) => Math.max(prev - 1, 0));
	}, []);

	// Keyboard navigation
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "ArrowRight" || e.key === " ") {
				e.preventDefault();
				goNext();
			} else if (e.key === "ArrowLeft") {
				e.preventDefault();
				goPrev();
			} else if (e.key === "m" || e.key === "M") {
				e.preventDefault();
				setIsNavOpen((prev) => !prev);
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [goNext, goPrev]);

	const slide = slides[currentSlide];
	if (!slide) return null;

	const scheduleDate = new Date(session.scheduleDate);
	const shortDate = scheduleDate.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});

	return (
		<div className="w-full">
			{/* Full presentation container */}
			<div className="relative bg-[#dc2626] rounded-2xl overflow-hidden flex flex-col min-h-[60vh] md:min-h-[70vh]">
				{/* Top Bar */}
				<div className="bg-black/50 border-b border-white/20 px-3 md:px-6 py-3 shrink-0">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3 md:gap-4">
							{onExitPresentation ? (
								<button
									onClick={onExitPresentation}
									className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-white hover:bg-white/10 transition-colors cursor-pointer"
									aria-label="Exit presentation"
								>
									<LogOut className="h-4 w-4" />
									<span className="hidden md:inline text-sm font-medium">
										Exit Presentation
									</span>
								</button>
							) : (
								<button
									onClick={goPrev}
									disabled={currentSlide === 0}
									className="inline-flex items-center px-2.5 py-1.5 rounded-md text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
									aria-label="Go back"
								>
									<ChevronLeft className="h-4 w-4" />
								</button>
							)}
							<span className="text-xs md:text-sm text-white/80">
								Session #{session.sessionNumber} &bull; {shortDate}
							</span>
						</div>
						{/* Menu Button */}
						<button
							onClick={() => setIsNavOpen((prev) => !prev)}
							className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-white hover:bg-white/10 transition-colors cursor-pointer"
							aria-label="Toggle navigation menu"
						>
							<Menu className="h-4 w-4" />
							<span className="hidden md:inline text-sm font-medium">Menu</span>
						</button>
					</div>
				</div>

				{/* Slide Content Area */}
				<div className="flex-1 flex items-center justify-center overflow-y-auto p-4 sm:p-8 md:p-12">
					<div className="w-full max-w-4xl mx-auto">
						{slide.type === "cover" ? (
							<CoverSlideContent
								sessionNumber={session.sessionNumber}
								sessionType={getSessionTypeLabel(session.type)}
								date={formatSessionDate(scheduleDate)}
								time={formatSessionTime(scheduleDate)}
							/>
						) : (
							<SectionSlideContent
								letter={slide.letter ?? ""}
								label={slide.label ?? ""}
								items={slide.items ?? []}
							/>
						)}
					</div>
				</div>

				{/* Bottom Navigation Bar */}
				<div className="bg-black/50 border-t border-white/20 px-3 md:px-16 py-3 shrink-0">
					<div className="flex items-center justify-between">
						{/* Previous */}
						<button
							onClick={goPrev}
							disabled={currentSlide === 0}
							className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
							aria-label="Previous slide"
						>
							<ChevronLeft className="h-4 w-4" />
							<span className="hidden md:inline text-sm font-medium">
								Previous
							</span>
						</button>

						{/* Slide Counter */}
						<span className="text-sm md:text-lg font-medium text-white/80">
							{currentSlide + 1} / {totalSlides}
						</span>

						{/* Next */}
						<button
							onClick={goNext}
							disabled={currentSlide === totalSlides - 1}
							className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
							aria-label="Next slide"
						>
							<span className="hidden md:inline text-sm font-medium">Next</span>
							<ChevronRight className="h-4 w-4" />
						</button>
					</div>
				</div>

				{/* Keyboard Shortcuts Tooltip (desktop) */}
				{!isNavOpen && (
					<div className="hidden md:block absolute bottom-20 right-3 bg-black/70 rounded-lg px-3 py-2 text-xs text-white/70 space-y-1">
						<p className="font-medium">Keyboard Shortcuts:</p>
						<p>&larr; &rarr; Navigate &bull; M Toggle menu</p>
					</div>
				)}

				{/* Navigation Drawer */}
				{isNavOpen && (
					<PresentationNavDrawer
						slides={slides}
						currentSlide={currentSlide}
						onGoto={(index) => {
							setCurrentSlide(index);
							setIsNavOpen(false);
						}}
						onClose={() => setIsNavOpen(false)}
					/>
				)}
			</div>
		</div>
	);
}

function CoverSlideContent({
	sessionNumber,
	sessionType,
	date,
	time,
}: {
	sessionNumber: number;
	sessionType: string;
	date: string;
	time: string;
}) {
	return (
		<div className="text-center text-white space-y-3 sm:space-y-4 md:space-y-6">
			{/* City Seal Placeholder */}
			<div className="flex justify-center">
				<div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-white/10 rounded-full flex items-center justify-center">
					<svg
						className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white/80"
						fill="currentColor"
						viewBox="0 0 24 24"
					>
						<path d="M12 2L2 7l10 5 10-5-10-5z" />
						<path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
					</svg>
				</div>
			</div>
			<h1 className="text-xl sm:text-2xl md:text-5xl font-bold leading-tight">
				Sangguniang Panlungsod ng Iloilo
			</h1>
			<p className="text-base sm:text-xl md:text-3xl text-white/90">
				{sessionType} #{sessionNumber}
			</p>
			<p className="text-sm sm:text-base md:text-2xl text-white/80">{date}</p>
			<p className="text-sm sm:text-base md:text-xl text-white/80">{time}</p>
			<p className="text-xs sm:text-sm md:text-lg text-white/70 pt-2 md:pt-4">
				Press &rarr; or click Next to begin
			</p>
		</div>
	);
}

function SectionSlideContent({
	letter,
	label,
	items,
}: {
	letter: string;
	label: string;
	items: SessionWithAgenda["agendaItems"];
}) {
	// Filter visible documents: published or for_agenda
	const visibleItems = items.filter((item) => {
		if (!item.document) return true;
		return (
			item.document.status === "published" ||
			item.document.purpose === "for_agenda"
		);
	});

	return (
		<div className="text-white space-y-4">
			{/* Section Label */}
			<p className="text-center text-sm md:text-base text-white/70">{label}</p>

			{/* Items */}
			{visibleItems.length > 0 ? (
				<div className="space-y-4">
					{visibleItems.map((item) => (
						<div
							key={item.id}
							className="bg-white/10 rounded-xl p-5 sm:p-6 space-y-4"
						>
							{item.document ? (
								<>
									{/* Type Badge + Code Number */}
									<div className="flex items-center gap-2 flex-wrap">
										{item.document.type && (
											<span
												className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium ${getDocumentTypeBadgeClass(item.document.type)}`}
											>
												<FileText className="w-3 h-3" />
												{item.document.type}
											</span>
										)}
										<span className="text-sm text-[#ffc107] font-semibold">
											{item.document.codeNumber}
										</span>
									</div>

									{/* Title */}
									<h3 className="text-lg sm:text-xl font-bold leading-snug">
										{item.document.title}
									</h3>

									{/* Metadata Fields */}
									<div className="flex flex-wrap gap-x-6 gap-y-2">
										{item.document.classification && (
											<MetadataField
												label="Classification"
												value={getClassificationLabel(
													item.document.classification,
												)}
											/>
										)}
										<MetadataField
											label="Status"
											value={item.document.status}
										/>
										<MetadataField
											label="Purpose"
											value={item.document.purpose}
										/>
									</div>

									{/* Action Buttons */}
									<div className="space-y-2 pt-2">
										<Link
											href={`/legislative-documents/${item.document.id}`}
											className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-md bg-[#ffc107] text-gray-900 text-sm font-medium hover:bg-[#ffca2c] transition-colors"
										>
											<FileText className="h-4 w-4" />
											View Full Document
										</Link>
									</div>
								</>
							) : (
								item.contentText && (
									<p className="text-sm sm:text-base text-white/90">
										{item.contentText}
									</p>
								)
							)}
						</div>
					))}
				</div>
			) : (
				<div className="text-center py-8">
					<p className="text-base sm:text-lg text-white/50 italic">
						No items for this section
					</p>
				</div>
			)}
		</div>
	);
}

function MetadataField({ label, value }: { label: string; value: string }) {
	return (
		<div className="space-y-0.5">
			<p className="text-sm text-white/60">{label}</p>
			<p className="text-sm font-medium text-white">{value}</p>
		</div>
	);
}

function PresentationNavDrawer({
	slides,
	currentSlide,
	onGoto,
	onClose,
}: {
	slides: Slide[];
	currentSlide: number;
	onGoto: (index: number) => void;
	onClose: () => void;
}) {
	return (
		<div className="absolute inset-x-0 top-12 bottom-12 sm:inset-x-auto sm:right-0 sm:top-14 sm:bottom-14 sm:w-72 md:w-80 bg-neutral-950/95 backdrop-blur-md sm:border-l border-white/10 shadow-2xl z-40 flex flex-col">
			<div className="flex items-center justify-between p-4 border-b border-white/10">
				<h3 className="text-sm font-semibold text-white">Session Navigation</h3>
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
					className="cursor-pointer text-white/60 hover:text-white hover:bg-white/10"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
			<div className="flex-1 overflow-auto p-4">
				<div className="space-y-1.5">
					{slides.map((slide, index) => (
						<button
							key={`slide-${slide.sectionKey ?? "cover"}`}
							type="button"
							onClick={() => onGoto(index)}
							className={`w-full text-left px-3 py-2 rounded-md transition-all cursor-pointer text-sm ${
								index === currentSlide
									? "bg-[#ffc107] text-gray-900 font-medium shadow-lg"
									: "bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
							}`}
						>
							{slide.type === "cover"
								? "Cover"
								: `${slide.letter}. ${slide.label}`}
						</button>
					))}
				</div>
			</div>
			<div className="p-4 border-t border-white/10 bg-black/30">
				<div className="text-xs text-white/50 space-y-1.5">
					<p className="font-semibold text-white/60">Keyboard Shortcuts:</p>
					<p>
						<kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-white/70">
							← / → / Space
						</kbd>{" "}
						Navigate
					</p>
					<p>
						<kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-white/70">
							M
						</kbd>{" "}
						Toggle menu
					</p>
				</div>
			</div>
		</div>
	);
}
