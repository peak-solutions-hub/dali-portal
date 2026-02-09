"use client";

import { formatSessionDate, formatSessionTime } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	ChevronDown,
	Eraser,
	Eye,
	Maximize2,
	Menu,
	Minimize2,
	Pencil,
	Trash2,
	X,
} from "@repo/ui/lib/lucide-react";
import { useRef, useState } from "react";

export function PresentationTopBar({
	sessionNumber,
	sessionDate,
	sessionTime,
	isFullscreen,
	onEnterFullscreen,
	onExitFullscreen,
	drawingMode,
	isEraser,
	onToggleDrawing,
	onToggleEraser,
	onClearCanvas,
	presenterView,
	onTogglePresenter,
	showNavMenu,
	onToggleMenu,
	onExit,
	isVisible = true,
	isController = true,
}: {
	sessionNumber: string;
	sessionDate: string;
	sessionTime: string;
	isFullscreen: boolean;
	onEnterFullscreen: () => void;
	onExitFullscreen: () => void;
	drawingMode: boolean;
	isEraser?: boolean;
	onToggleDrawing: () => void;
	onToggleEraser?: () => void;
	onClearCanvas?: () => void;
	presenterView: boolean;
	onTogglePresenter: () => void;
	showNavMenu: boolean;
	onToggleMenu: () => void;
	onExit: () => void;
	isVisible?: boolean;
	isController?: boolean;
}) {
	const [showDrawingTools, setShowDrawingTools] = useState(false);
	const drawingButtonRef = useRef<HTMLButtonElement>(null);
	return (
		<div
			className={`fixed top-0 left-0 right-0 h-14 bg-black/60 backdrop-blur-lg border-b shadow-2xl flex items-center justify-between px-6 z-50 transition-transform duration-300 ${!isVisible ? "-translate-y-full" : "translate-y-0"}`}
		>
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={onExit}
					className="gap-2 cursor-pointer  text-white hover:text-white hover:bg-white/20  transition-all font-medium"
				>
					<X className="h-4 w-4" />
					Exit Presentation
				</Button>
				<div className="h-6 w-px bg-white/20" />
				<span className="text-sm text-white/90 font-medium">
					Session #{sessionNumber} • {formatSessionDate(sessionDate)} •{" "}
					{formatSessionTime(`${sessionDate}T${sessionTime}`)}
				</span>
			</div>
			<div className="flex items-center gap-2">
				{isFullscreen ? (
					<Button
						variant="ghost"
						size="sm"
						onClick={onExitFullscreen}
						className="cursor-pointer bg-white/10 text-white/90 hover:text-white hover:bg-white/20 transition-all"
					>
						<Minimize2 className="h-4 w-4" />
						Exit Fullscreen
					</Button>
				) : (
					<Button
						variant="ghost"
						size="sm"
						onClick={onEnterFullscreen}
						className="cursor-pointer bg-orange-500/10 text-orange-400 hover:text-white hover:bg-orange-500 transition-all"
					>
						<Maximize2 className="h-4 w-4" />
						Enter Fullscreen
					</Button>
				)}
				<div className="relative">
					<Button
						ref={drawingButtonRef}
						variant="ghost"
						size="sm"
						onClick={() => {
							if (!drawingMode) {
								onToggleDrawing();
								if (isController) setShowDrawingTools(true);
							} else if (isController) {
								setShowDrawingTools((p) => !p);
							} else {
								// Not controller, clicking turns off drawing
								onToggleDrawing();
							}
						}}
						className={`cursor-pointer gap-2 transition-all ${drawingMode ? (isController ? "bg-blue-500 text-white hover:bg-blue-400" : "bg-blue-500/40 text-blue-200 hover:bg-blue-500/60") : "bg-white/10 text-white/90 hover:text-white hover:bg-white/20"}`}
					>
						<Pencil className="h-4 w-4" />
						{drawingMode
							? isController
								? "Drawing"
								: "Drawing (Presenter)"
							: "Draw"}
						{drawingMode && isController && <ChevronDown className="h-3 w-3" />}
					</Button>

					{/* Drawing Tools Dropdown - only show when this view is the controller */}
					{showDrawingTools && drawingMode && isController && (
						<div className="absolute top-full left-0 mt-1 bg-black/95 border border-white/10 rounded-lg shadow-xl z-60 min-w-44 py-1">
							<button
								type="button"
								onClick={() => onToggleEraser?.()}
								className={`w-full flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${!isEraser ? "bg-blue-500/20 text-blue-400" : "text-white/80 hover:bg-white/10"}`}
							>
								<Pencil className="h-4 w-4" />
								Pen
							</button>
							<button
								type="button"
								onClick={() => onToggleEraser?.()}
								className={`w-full flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${isEraser ? "bg-blue-500/20 text-blue-400" : "text-white/80 hover:bg-white/10"}`}
							>
								<Eraser className="h-4 w-4" />
								Eraser
							</button>
							<div className="h-px bg-white/10 my-1" />
							<button
								type="button"
								onClick={() => onClearCanvas?.()}
								className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
							>
								<Trash2 className="h-4 w-4" />
								Clear All
							</button>
							<div className="h-px bg-white/10 my-1" />
							<button
								type="button"
								onClick={() => {
									onToggleDrawing();
									setShowDrawingTools(false);
								}}
								className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 cursor-pointer transition-colors"
							>
								<X className="h-4 w-4" />
								Exit Drawing
							</button>
						</div>
					)}
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={onTogglePresenter}
					className={`cursor-pointer gap-2 transition-all ${presenterView ? "bg-purple-500 text-white hover:bg-purple-400 " : "bg-white/10 text-white/90 hover:text-white hover:bg-white/20"}`}
				>
					<Eye className="h-4 w-4" />
					{presenterView ? "Presenter: ON" : "Presenter: OFF"}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={onToggleMenu}
					className={`cursor-pointer gap-2 transition-all ${showNavMenu ? "bg-yellow-500 text-gray-900 hover:bg-yellow-400" : "bg-white/10 text-white/90 hover:text-white hover:bg-white/20"}`}
				>
					<Menu className="h-4 w-4" />
					Menu
				</Button>
			</div>
		</div>
	);
}
