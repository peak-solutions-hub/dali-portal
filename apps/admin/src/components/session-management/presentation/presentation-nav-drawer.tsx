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
		<div className="fixed right-0 top-12 bottom-16 w-96 bg-white border-l border-gray-200 shadow-2xl z-40 flex flex-col">
			<div className="flex items-center justify-between p-6 border-b border-gray-200">
				<h3 className="text-lg font-semibold text-gray-900">
					Session Navigation
				</h3>
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
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
							onClick={() => onGoto(index)}
							className={`w-full text-left p-3 rounded-lg transition-colors cursor-pointer ${index === currentSlideIndex ? "bg-[#a60202]/10 text-[#a60202] font-medium border border-[#a60202]/20" : "hover:bg-gray-50 text-gray-900"}`}
						>
							<div className="flex items-start gap-3">
								<span className="text-xs text-gray-500 mt-0.5">
									{index + 1}
								</span>
								<span className="flex-1">
									{slide.type === "cover" ? "Cover" : slide.title}
								</span>
							</div>
						</button>
					))}
				</div>
			</div>
			<div className="p-6 border-t border-gray-200 bg-gray-50">
				<div className="text-xs text-gray-600 space-y-2">
					<div className="font-semibold mb-2">Keyboard Shortcuts:</div>
					<div className="flex justify-between">
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded">
								←/→/Space
							</kbd>
							Navigate
						</span>
					</div>
					<div className="flex justify-between">
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded">
								D
							</kbd>
							Toggle drawing
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
								P
							</kbd>
							Presenter view
						</span>
					</div>
					<div className="flex justify-between">
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded">
								F
							</kbd>
							Fullscreen
						</span>
						<span className="flex items-center gap-2">
							<kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded">
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
