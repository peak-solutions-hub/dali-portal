"use client";

import type { SessionPresentationSlide } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { X } from "@repo/ui/lib/lucide-react";

function stripAgendaNumber(title: string): string {
	return title.replace(/^\d+\.?\s*[-–—]?\s*/, "");
}

interface PresenterNavDrawerProps {
	open: boolean;
	onClose: () => void;
	slides: SessionPresentationSlide[];
	currentSlideIndex: number;
	onGoto?: (index: number) => void;
}

export function PresenterNavDrawer({
	open,
	onClose,
	slides,
	currentSlideIndex,
	onGoto,
}: PresenterNavDrawerProps) {
	if (!open) return null;

	return (
		<div className="absolute right-0 top-0 bottom-0 w-64 bg-black/95 backdrop-blur-md border-l border-white/10 shadow-2xl z-40 flex flex-col">
			<div className="flex items-center justify-between p-3 border-b border-white/10">
				<h3 className="text-sm font-semibold text-white">Navigation</h3>
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
					className="cursor-pointer text-white/60 hover:text-white hover:bg-white/10 h-6 w-6 p-0"
				>
					<X className="h-3.5 w-3.5" />
				</Button>
			</div>
			<div className="flex-1 overflow-auto p-3">
				<div className="space-y-1.5">
					{slides.map((slide, index) => (
						<button
							key={slide.id}
							type="button"
							onClick={() => {
								onGoto?.(index);
								onClose();
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
					<div>←/→ Navigate • D Draw • L Pointer • M Menu • F Fullscreen</div>
				</div>
			</div>
		</div>
	);
}
