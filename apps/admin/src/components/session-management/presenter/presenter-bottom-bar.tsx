"use client";

import type { SessionPresentationSlide } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
} from "@repo/ui/lib/lucide-react";

function stripAgendaNumber(title: string): string {
	return title.replace(/^\d+\.?\s*[-–—]?\s*/, "");
}

interface PresenterBottomBarProps {
	currentSlideIndex: number;
	totalSlides: number;
	currentSlide: SessionPresentationSlide;
	slides: SessionPresentationSlide[];
	barsVisible: boolean;
	onPrev?: () => void;
	onNext?: () => void;
	onGoto?: (index: number) => void;
	onToggleMenu: () => void;
}

export function PresenterBottomBar({
	currentSlideIndex,
	totalSlides,
	currentSlide,
	slides,
	barsVisible,
	onPrev,
	onNext,
	onGoto,
	onToggleMenu,
}: PresenterBottomBarProps) {
	return (
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
						onClick={onToggleMenu}
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
						{slides.slice(0, 8).map((_, index) => (
							<button
								key={index}
								type="button"
								onClick={() => onGoto?.(index)}
								disabled={!onGoto}
								className={`cursor-pointer h-2 rounded-full transition-all ${index === currentSlideIndex ? "w-6 bg-white" : "w-2 bg-white/30 hover:bg-white/50"}`}
								aria-label={`Go to slide ${index + 1}`}
							/>
						))}
						{slides.length > 8 && (
							<span className="text-xs text-white/50 ml-1">
								+{slides.length - 8}
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
	);
}
