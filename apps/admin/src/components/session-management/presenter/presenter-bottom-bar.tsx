"use client";

import type { SessionPresentationSlide } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Pencil,
} from "@repo/ui/lib/lucide-react";

export function PresenterBottomBar({
	slides,
	currentSlide,
	currentSlideIndex,
	totalSlides,
	onPrev,
	onNext,
	onToggleNavMenu,
	onGoto,
}: {
	slides: SessionPresentationSlide[];
	currentSlide: SessionPresentationSlide;
	currentSlideIndex: number;
	totalSlides: number;
	onPrev?: () => void;
	onNext?: () => void;
	onToggleNavMenu: () => void;
	onGoto?: (index: number) => void;
}) {
	return (
		<div className="fixed bottom-0 left-0 right-0 h-16 bg-black/60 backdrop-blur-lg border-t border-white/10 shadow-2xl flex items-center justify-center px-3 sm:px-6 z-50">
			<div className="flex items-center justify-between w-full max-w-5xl">
				<Button
					variant="ghost"
					size="sm"
					onClick={onPrev}
					disabled={!onPrev || currentSlideIndex === 0}
					className="cursor-pointer text-white hover:text-white hover:bg-white/10 disabled:text-white/30 disabled:hover:bg-transparent transition-colors"
				>
					<ChevronLeft className="h-4 w-4" />
					Previous
				</Button>
				<div className="flex items-center gap-4">
					<span className="text-lg font-semibold text-white">
						{currentSlideIndex + 1} / {totalSlides}
					</span>
					<button
						type="button"
						onClick={onToggleNavMenu}
						className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 transition-colors text-sm text-white cursor-pointer font-medium"
					>
						<span>
							{currentSlide.type === "cover" ? "Cover" : currentSlide.title}
						</span>
						<ChevronDown className="h-4 w-4" />
					</button>
					<div className="flex items-center gap-2">
						{slides.map((s: SessionPresentationSlide, index: number) => (
							<button
								key={s.id}
								type="button"
								onClick={() => onGoto && onGoto(index)}
								disabled={!onGoto}
								className={`cursor-pointer h-2 rounded-full transition-all ${index === currentSlideIndex ? "w-8 bg-[#ff6b6b]" : "w-2 bg-white/40 hover:bg-white/60"}`}
								aria-label={`Go to slide ${index + 1}`}
							/>
						))}
					</div>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={onNext}
					disabled={!onNext || currentSlideIndex >= totalSlides - 1}
					className="cursor-pointer text-white hover:text-white hover:bg-white/10 disabled:text-white/30 disabled:hover:bg-transparent transition-colors"
				>
					Next
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
