"use client";

import { Button } from "@repo/ui/components/button";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
} from "@repo/ui/lib/lucide-react";

export function PresentationBottomBar({
	currentSlideIndex,
	totalSlides,
	currentSlideTitle,
	onPrev,
	onNext,
	onToggleMenu,
	onGoto,
	isVisible = true,
}: {
	currentSlideIndex: number;
	totalSlides: number;
	currentSlideTitle: string;
	onPrev: () => void;
	onNext: () => void;
	onToggleMenu: () => void;
	onGoto: (index: number) => void;
	isVisible?: boolean;
}) {
	return (
		<div
			className={`fixed bottom-0 left-0 right-0 h-16 bg-black/60 backdrop-blur-lg border-t  shadow-2xl flex items-center justify-center px-20 z-50 transition-transform duration-300 ${!isVisible ? "translate-y-full" : "translate-y-0"}`}
		>
			<div className="flex items-center justify-between w-full max-w-5xl">
				<Button
					variant="ghost"
					size="sm"
					onClick={onPrev}
					disabled={currentSlideIndex === 0}
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
						onClick={onToggleMenu}
						className="flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 transition-colors text-sm text-white cursor-pointer font-medium"
					>
						<span>{currentSlideTitle}</span>
						<ChevronDown className="h-4 w-4" />
					</button>
					<div className="flex items-center gap-2">
						{Array.from({ length: totalSlides }).map((_, index) => (
							<button
								key={index}
								type="button"
								onClick={() => onGoto(index)}
								className={`cursor-pointer h-2 rounded-full transition-all ${index === currentSlideIndex ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"}`}
								aria-label={`Go to slide ${index + 1}`}
							/>
						))}
					</div>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={onNext}
					disabled={currentSlideIndex === totalSlides - 1}
					className="cursor-pointer text-white hover:text-white hover:bg-white/10 disabled:text-white/30 disabled:hover:bg-transparent transition-colors"
				>
					Next
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
