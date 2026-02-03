"use client";

import type { SessionPresentationSlide } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { X } from "@repo/ui/lib/lucide-react";

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
		<div className="fixed right-0 top-12 bottom-16 w-96 bg-black/80 backdrop-blur-md border-l border-gray-900 shadow-2xl z-40 flex flex-col">
			<div className="flex items-center justify-between p-6 border-b ">
				<h3 className="text-lg font-semibold text-white">Session Navigation</h3>
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
					className="cursor-pointer text-gray-400 hover:text-white hover:bg-gray-900"
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
							onClick={() => onGoto(index)}
							className={`w-full text-left px-4 py-3 rounded-md transition-all cursor-pointer ${
								index === currentSlideIndex
									? "bg-yellow-500 text-gray-900 font-medium shadow-lg"
									: "bg-white/10 text-gray-200 hover:bg-gray-100/40 hover:text-white"
							}`}
						>
							<span className="block truncate">
								{slide.type === "cover" ? "Cover" : slide.title}
							</span>
						</button>
					))}
				</div>
			</div>
			<div className="p-6 border-t border-gray-900 bg-black/50">
				<div className="text-xs text-gray-400 space-y-2">
					<div className="font-semibold mb-2 text-gray-300">
						Keyboard Shortcuts:
					</div>
					<div className="flex justify-between">
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-gray-700 border border-gray-800 rounded text-gray-300">
								←/→/Space
							</kbd>
							Navigate
						</span>
					</div>
					<div className="flex justify-between">
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-gray-700 border border-gray-800 rounded text-gray-300">
								D
							</kbd>
							Toggle drawing
						</span>
					</div>
					<div className="flex justify-between">
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-gray-700 border border-gray-800 rounded text-gray-300">
								M
							</kbd>
							Toggle menu
						</span>
					</div>
					<div className="flex justify-between">
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-gray-700 border border-gray-800 rounded text-gray-300">
								P
							</kbd>
							Presenter view
						</span>
					</div>
					<div className="flex justify-between">
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-gray-700 border border-gray-800 rounded text-gray-300">
								F
							</kbd>
							Fullscreen
						</span>
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-gray-700 border border-gray-800 rounded text-gray-300">
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
