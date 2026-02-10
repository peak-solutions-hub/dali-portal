"use client";

import { formatSessionDate } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	ChevronDown,
	Eraser,
	Maximize2,
	Menu,
	Minimize2,
	MousePointer2,
	Pencil,
	Trash2,
	X,
} from "@repo/ui/lib/lucide-react";

interface PresenterTopBarProps {
	sessionNumber?: string;
	sessionDate: string;
	isFullscreen: boolean;
	barsVisible: boolean;
	onEnterFullscreen: () => void;
	onExitFullscreen: () => void;
	onCloseWindow: () => void;
	// Drawing
	drawingMode: boolean;
	externalDrawingActive: boolean;
	isEraser: boolean;
	showDrawingTools: boolean;
	drawingButtonRef: React.RefObject<HTMLButtonElement | null>;
	onToggleDrawing: () => void;
	onSetEraser: (eraser: boolean) => void;
	onClearCanvas: () => void;
	onExitDrawing: () => void;
	onToggleDrawingTools: () => void;
	// Pointer
	pointerMode: boolean;
	externalPointerActive: boolean;
	onTogglePointer: () => void;
	// Menu
	showNavMenu: boolean;
	onToggleMenu: () => void;
}

export function PresenterTopBar({
	sessionNumber,
	sessionDate,
	isFullscreen,
	barsVisible,
	onEnterFullscreen,
	onExitFullscreen,
	onCloseWindow,
	drawingMode,
	externalDrawingActive,
	isEraser,
	showDrawingTools,
	drawingButtonRef,
	onToggleDrawing,
	onSetEraser,
	onClearCanvas,
	onExitDrawing,
	onToggleDrawingTools,
	pointerMode,
	externalPointerActive,
	onTogglePointer,
	showNavMenu,
	onToggleMenu,
}: PresenterTopBarProps) {
	return (
		<div
			className={`shrink-0 h-14 bg-black/60 backdrop-blur-lg border-b border-white/10 flex items-center justify-between px-4 transition-opacity duration-300 z-50 relative ${!barsVisible ? "opacity-50" : "opacity-100"}`}
		>
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="sm"
					onClick={onCloseWindow}
					className="gap-1.5 cursor-pointer text-white hover:text-white hover:bg-white/20 transition-all font-medium text-xs h-8"
				>
					<X className="h-3.5 w-3.5" />
					Close
				</Button>
				<div className="h-5 w-px bg-white/20" />
				<span className="text-xs text-white/90 font-medium">
					#{sessionNumber} • {formatSessionDate(sessionDate)}
				</span>
			</div>
			<div className="flex items-center gap-1.5">
				{isFullscreen ? (
					<Button
						variant="ghost"
						size="sm"
						onClick={onExitFullscreen}
						className="cursor-pointer bg-white/10 text-white/90 hover:text-white hover:bg-white/20 transition-all h-8 text-xs"
					>
						<Minimize2 className="h-3.5 w-3.5" />
					</Button>
				) : (
					<Button
						variant="ghost"
						size="sm"
						onClick={onEnterFullscreen}
						className="cursor-pointer bg-orange-500/10 text-orange-400 hover:text-white hover:bg-orange-500 transition-all h-8 text-xs"
					>
						<Maximize2 className="h-3.5 w-3.5" />
					</Button>
				)}
				<div className="relative">
					<Button
						ref={drawingButtonRef}
						variant="ghost"
						size="sm"
						onClick={onToggleDrawing}
						className={`cursor-pointer gap-1.5 transition-all h-8 text-xs ${drawingMode && !externalDrawingActive ? "bg-blue-500 text-white hover:bg-blue-400" : externalDrawingActive ? "bg-blue-500/40 text-blue-200 hover:bg-blue-500/60" : "bg-white/10 text-white/90 hover:text-white hover:bg-white/20"}`}
					>
						<Pencil className="h-3.5 w-3.5" />
						{drawingMode
							? externalDrawingActive
								? "Drawing (Presentation)"
								: "Drawing"
							: "Draw"}
						{drawingMode && !externalDrawingActive && (
							<ChevronDown className="h-3 w-3" />
						)}
					</Button>

					{showDrawingTools && drawingMode && !externalDrawingActive && (
						<div className="absolute top-full left-0 mt-1 bg-black/95 border border-white/10 rounded-lg shadow-xl z-60 min-w-40 py-1">
							<button
								type="button"
								onClick={() => onSetEraser(false)}
								className={`w-full flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors ${!isEraser ? "bg-blue-500/20 text-blue-400" : "text-white/80 hover:bg-white/10"}`}
							>
								<Pencil className="h-3.5 w-3.5" />
								Pen
							</button>
							<button
								type="button"
								onClick={() => onSetEraser(true)}
								className={`w-full flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors ${isEraser ? "bg-blue-500/20 text-blue-400" : "text-white/80 hover:bg-white/10"}`}
							>
								<Eraser className="h-3.5 w-3.5" />
								Eraser
							</button>
							<div className="h-px bg-white/10 my-1" />
							<button
								type="button"
								onClick={onClearCanvas}
								className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
							>
								<Trash2 className="h-3.5 w-3.5" />
								Clear All
							</button>
							<div className="h-px bg-white/10 my-1" />
							<button
								type="button"
								onClick={onExitDrawing}
								className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-white/10 cursor-pointer transition-colors"
							>
								<X className="h-3.5 w-3.5" />
								Exit Drawing
							</button>
						</div>
					)}
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={onTogglePointer}
					className={`cursor-pointer gap-1.5 transition-all h-8 text-xs ${pointerMode ? "bg-cyan-600 text-white hover:bg-cyan-500" : externalPointerActive ? "bg-cyan-600/40 text-cyan-200 hover:bg-cyan-600/60" : "bg-white/10 text-white/90 hover:text-white hover:bg-white/20"}`}
				>
					<MousePointer2 className="h-3.5 w-3.5" />
					{pointerMode
						? "Pointer: ON"
						: externalPointerActive
							? "Pointer (Presentation)"
							: "Pointer"}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={onToggleMenu}
					className={`cursor-pointer gap-1.5 transition-all h-8 text-xs ${showNavMenu ? "bg-yellow-500 text-gray-900 hover:bg-yellow-400" : "bg-white/10 text-white/90 hover:text-white hover:bg-white/20"}`}
				>
					<Menu className="h-3.5 w-3.5" />
					Menu
				</Button>
			</div>
		</div>
	);
}
