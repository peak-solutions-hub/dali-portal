"use client";

import type { SessionPresentationSlide } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { X } from "@repo/ui/lib/lucide-react";

export function PresenterNavDrawer({
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
	onGoto?: (index: number) => void;
}) {
	if (!open) return null;

	return (
		<div className="absolute right-0 top-10 bottom-0 w-72 bg-gray-900/95 backdrop-blur-md border-l border-gray-800 shadow-2xl z-40 flex flex-col overflow-hidden">
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
				<h3 className="text-sm font-semibold text-white">Navigation</h3>
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
					className="cursor-pointer h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/10"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
			<div className="flex-1 overflow-auto p-3">
				<div className="space-y-1">
					{slides.map((slide, index) => (
						<button
							key={slide.id}
							type="button"
							onClick={() => {
								if (onGoto) onGoto(index);
								onClose();
							}}
							disabled={!onGoto}
							className={`w-full text-left px-3 py-2 rounded transition-all cursor-pointer text-sm ${
								index === currentSlideIndex
									? "bg-white text-gray-900 font-medium"
									: "text-gray-300 hover:bg-white/10 hover:text-white"
							}`}
						>
							<span className="flex items-center gap-2">
								<span className="text-xs text-gray-500 w-5">{index + 1}.</span>
								<span className="truncate">
									{slide.type === "cover"
										? "Cover"
										: slide.title.replace(/^\d+\.?\s*/, "")}
								</span>
							</span>
						</button>
					))}
				</div>
			</div>
			<div className="px-4 py-3 border-t border-gray-800 bg-black/30">
				<div className="text-xs text-gray-500 space-y-1">
					<div className="flex items-center gap-2">
						<kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400">
							←/→
						</kbd>
						<span>Navigate</span>
					</div>
					<div className="flex items-center gap-2">
						<kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400">
							D
						</kbd>
						<span>Draw</span>
						<kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400 ml-2">
							M
						</kbd>
						<span>Menu</span>
					</div>
				</div>
			</div>
		</div>
	);
}
