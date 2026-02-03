"use client";

import { formatSessionDate, formatSessionTime } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Maximize2,
	Menu,
	Minimize2,
	Pencil,
	X,
} from "@repo/ui/lib/lucide-react";

export function PresenterTopBar({
	sessionNumber,
	sessionDate,
	sessionTime,
	isFullscreen,
	onEnterFullscreen,
	onExitFullscreen,
	drawingMode,
	externalDrawingActive,
	onToggleDrawing,
	showNavMenu,
	onToggleNavMenu,
}: {
	sessionNumber?: string;
	sessionDate: string;
	sessionTime: string;
	isFullscreen: boolean;
	onEnterFullscreen: () => void;
	onExitFullscreen: () => void;
	drawingMode: boolean;
	externalDrawingActive: boolean;
	onToggleDrawing: () => void;
	showNavMenu: boolean;
	onToggleNavMenu: () => void;
}) {
	return (
		<div className="fixed top-0 left-0 right-0 h-14 bg-black/60 backdrop-blur-lg border-b border-white/10 shadow-2xl flex items-center justify-between px-3 sm:px-6 z-50">
			<div className="flex items-center gap-4 min-w-0">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => window.close()}
					className="gap-2 cursor-pointer bg-red-500/20 border border-red-500/50 text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all font-medium"
				>
					<X className="h-4 w-4" />
					Close
				</Button>
				<div className="h-6 w-px bg-white/20" />
				<span className="text-sm text-white/90 font-medium truncate">
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
						className="cursor-pointer bg-white/5 text-white/90 hover:text-white hover:bg-white/15 transition-all"
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
				<Button
					variant="ghost"
					size="sm"
					onClick={onToggleDrawing}
					className={`cursor-pointer gap-2 transition-all ${drawingMode ? "bg-blue-500 text-white hover:bg-blue-600" : externalDrawingActive ? "bg-blue-500/40 text-blue-200 hover:bg-blue-500/60" : "bg-white/5 text-white/90 hover:text-white hover:bg-white/15"}`}
				>
					<Pencil className="h-4 w-4" />
					{drawingMode
						? "Drawing..."
						: externalDrawingActive
							? "Drawing"
							: "Draw"}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={onToggleNavMenu}
					className={`cursor-pointer gap-2 transition-all ${showNavMenu ? "bg-purple-500 text-white hover:bg-purple-600" : "bg-white/5 text-white/90 hover:text-white hover:bg-white/15"}`}
				>
					<Menu className="h-4 w-4" />
					Menu
				</Button>
			</div>
		</div>
	);
}
