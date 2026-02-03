"use client";

import { formatSessionDate, formatSessionTime } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import {
	Eye,
	Maximize2,
	Menu,
	Minimize2,
	Pencil,
	X,
} from "@repo/ui/lib/lucide-react";

export function PresentationTopBar({
	sessionNumber,
	sessionDate,
	sessionTime,
	isFullscreen,
	onEnterFullscreen,
	onExitFullscreen,
	drawingMode,
	onToggleDrawing,
	presenterView,
	onTogglePresenter,
	onToggleMenu,
	onExit,
	isVisible = true,
}: {
	sessionNumber: string;
	sessionDate: string;
	sessionTime: string;
	isFullscreen: boolean;
	onEnterFullscreen: () => void;
	onExitFullscreen: () => void;
	drawingMode: boolean;
	onToggleDrawing: () => void;
	presenterView: boolean;
	onTogglePresenter: () => void;
	onToggleMenu: () => void;
	onExit: () => void;
	isVisible?: boolean;
}) {
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
				<Button
					variant="ghost"
					size="sm"
					onClick={onToggleDrawing}
					className={`cursor-pointer gap-2 transition-all ${drawingMode ? "bg-blue-500 text-white hover:bg-blue-400" : "bg-white/10 text-white/90 hover:text-white hover:bg-white/20"}`}
				>
					<Pencil className="h-4 w-4" />
					{drawingMode ? "Drawing..." : "Draw"}
				</Button>
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
					className="cursor-pointer bg-white/10 text-white/90 hover:text-white hover:bg-white/20 transition-all"
				>
					<Menu className="h-4 w-4" />
					Menu
				</Button>
			</div>
		</div>
	);
}
