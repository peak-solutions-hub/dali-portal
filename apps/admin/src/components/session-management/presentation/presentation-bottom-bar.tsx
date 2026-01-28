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
			className={`fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm border-t border-gray-200 flex items-center justify-center px-20 z-50 transition-transform duration-300 ${!isVisible ? "translate-y-full" : "translate-y-0"}`}
		>
			<div className="flex items-center justify-between w-full max-w-5xl">
				<Button
					variant="ghost"
					size="sm"
					onClick={onPrev}
					disabled={currentSlideIndex === 0}
					className="cursor-pointer"
				>
					<ChevronLeft className="h-4 w-4" />
					Previous
				</Button>
				<div className="flex items-center gap-4">
					<span className="text-lg font-medium text-gray-900">
						{currentSlideIndex + 1} / {totalSlides}
					</span>
					<button
						type="button"
						onClick={onToggleMenu}
						className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors text-sm text-gray-900 cursor-pointer"
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
								className={`cursor-pointer h-2 rounded-full transition-all ${index === currentSlideIndex ? "w-8 bg-[#a60202]" : "w-2 bg-gray-300 hover:bg-gray-400"}`}
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
					className="cursor-pointer"
				>
					Next
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
