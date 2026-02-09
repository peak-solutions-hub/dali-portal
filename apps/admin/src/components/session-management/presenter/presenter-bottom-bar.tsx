"use client";

import type { SessionPresentationSlide } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	ChevronLeft,
	ChevronRight,
	Copy,
	Eraser,
	Maximize2,
	MoreHorizontal,
	Pencil,
	Search,
	SquareSlash,
} from "@repo/ui/lib/lucide-react";
import { useState } from "react";

export function PresenterBottomBar({
	slides,
	currentSlide,
	currentSlideIndex,
	totalSlides,
	onPrev,
	onNext,
	onToggleNavMenu,
	onGoto,
	drawingMode,
	onToggleDrawing,
	isEraser,
	onToggleEraser,
}: {
	slides: SessionPresentationSlide[];
	currentSlide: SessionPresentationSlide;
	currentSlideIndex: number;
	totalSlides: number;
	onPrev?: () => void;
	onNext?: () => void;
	onToggleNavMenu: () => void;
	onGoto?: (index: number) => void;
	drawingMode?: boolean;
	onToggleDrawing?: () => void;
	isEraser?: boolean;
	onToggleEraser?: () => void;
}) {
	const [showDrawingMenu, setShowDrawingMenu] = useState(false);

	return (
		<div className="h-auto bg-black/80 backdrop-blur-sm">
			{/* Drawing tools dropdown - appears above when drawing is active */}
			{showDrawingMenu && (
				<div className="absolute bottom-full left-4 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-2 z-50">
					<div className="flex gap-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								if (isEraser) onToggleEraser?.();
							}}
							className={`cursor-pointer h-8 w-8 p-0 ${!isEraser && drawingMode ? "bg-white text-gray-900" : "text-white/80 hover:bg-white/10"}`}
							title="Pen"
						>
							<Pencil className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								if (!isEraser) onToggleEraser?.();
							}}
							className={`cursor-pointer h-8 w-8 p-0 ${isEraser ? "bg-orange-500 text-white" : "text-white/80 hover:bg-white/10"}`}
							title="Eraser"
						>
							<Eraser className="h-4 w-4" />
						</Button>
					</div>
					<div className="text-xs text-gray-500 mt-1 px-1">
						Press <kbd className="px-1 bg-gray-700 rounded">E</kbd> to toggle
					</div>
				</div>
			)}

			{/* Toolbar row */}
			<div className="flex items-center justify-center gap-1 px-4 py-2 border-b border-white/10">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => {
						onToggleDrawing?.();
						setShowDrawingMenu((p) => !p);
					}}
					className={`cursor-pointer h-9 w-9 p-0 ${drawingMode ? "bg-white/20 text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}
					title="Drawing tools (D)"
				>
					<Pencil className="h-5 w-5" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="cursor-pointer h-9 w-9 p-0 text-white/60 hover:text-white hover:bg-white/10"
					title="Copy slide"
				>
					<Copy className="h-5 w-5" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="cursor-pointer h-9 w-9 p-0 text-white/60 hover:text-white hover:bg-white/10"
					title="Zoom"
				>
					<Search className="h-5 w-5" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="cursor-pointer h-9 w-9 p-0 text-white/60 hover:text-white hover:bg-white/10"
					title="Black screen"
				>
					<SquareSlash className="h-5 w-5" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="cursor-pointer h-9 w-9 p-0 text-white/60 hover:text-white hover:bg-white/10"
					title="Thumbnail view"
				>
					<Maximize2 className="h-5 w-5" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={onToggleNavMenu}
					className="cursor-pointer h-9 w-9 p-0 text-white/60 hover:text-white hover:bg-white/10"
					title="More options (M)"
				>
					<MoreHorizontal className="h-5 w-5" />
				</Button>
			</div>

			{/* Navigation row */}
			<div className="flex items-center justify-center gap-4 px-4 py-3">
				<Button
					variant="ghost"
					size="sm"
					onClick={onPrev}
					disabled={!onPrev || currentSlideIndex === 0}
					className="cursor-pointer h-10 w-10 p-0 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10"
				>
					<ChevronLeft className="h-6 w-6" />
				</Button>
				<span className="text-white text-sm font-medium min-w-[100px] text-center">
					Slide {currentSlideIndex + 1} of {totalSlides}
				</span>
				<Button
					variant="ghost"
					size="sm"
					onClick={onNext}
					disabled={!onNext || currentSlideIndex >= totalSlides - 1}
					className="cursor-pointer h-10 w-10 p-0 rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10"
				>
					<ChevronRight className="h-6 w-6" />
				</Button>
			</div>
		</div>
	);
}
