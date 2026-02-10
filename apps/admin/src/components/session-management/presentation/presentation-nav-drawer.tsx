"use client";

import type { SessionPresentationSlide } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { X } from "@repo/ui/lib/lucide-react";

function stripAgendaNumber(title: string): string {
	// Remove patterns like "01. ", "1. ", "01 - ", etc.
	return title.replace(/^\d+\.?\s*[-–—]?\s*/, "");
}

export function PresentationNavDrawer({
	open,
	onClose,
	slides,
	currentSlideIndex,
	onGoto,
}: {
	open: boolean;
	onClose: () => void;
	slides: SessionPresentationSlide[];
	currentSlideIndex: number;
	onGoto: (index: number) => void;
}) {
	if (!open) return null;

	return (
		<div className="fixed right-0 top-12 bottom-16 w-86 bg-neutral-950/95 backdrop-blur-md border-l border-red-900/20 shadow-2xl z-40 flex flex-col">
			<div className="flex items-center justify-between p-6 border-b border-red-900/15">
				<h3 className="text-lg font-semibold text-white">Session Navigation</h3>
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
					className="cursor-pointer text-white/60 hover:text-white hover:bg-white/10"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
			<div className="flex-1 overflow-auto p-6">
				<div className="space-y-2">
					{slides.map((slide, index) => (
						<button
							key={slide.id}
							type="button"
							onClick={() => onGoto(index)}
							className={`w-full text-left px-4 py-2 rounded-md transition-all cursor-pointer text-sm ${
								index === currentSlideIndex
									? "bg-yellow-500 text-gray-900 font-medium shadow-lg"
									: "bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
							}`}
						>
							<span className="block break-words hyphens-auto">
								{slide.type === "cover"
									? "Cover"
									: stripAgendaNumber(slide.title)}
							</span>
						</button>
					))}
				</div>
			</div>
			<div className="p-6 border-t border-red-900/15 bg-black/30">
				<div className="text-xs text-white/50 space-y-2">
					<div className="font-semibold mb-2 text-white/60">
						Keyboard Shortcuts:
					</div>
					<div className="flex justify-between">
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/70">
								←/→/Space
							</kbd>
							Navigate
						</span>
					</div>
					<div className="flex justify-between">
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/70">
								D
							</kbd>
							Toggle drawing
						</span>
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/70">
								L
							</kbd>
							Pointer
						</span>
					</div>
					<div className="flex justify-between">
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/70">
								M
							</kbd>
							Toggle menu
						</span>
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/70">
								P
							</kbd>
							Presenter view
						</span>
					</div>
					<div className="flex justify-between">
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/70">
								F
							</kbd>
							Fullscreen
						</span>
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/70">
								ESC
							</kbd>
							Exit fullscreen
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
