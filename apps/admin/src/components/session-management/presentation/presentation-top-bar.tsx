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
			className={`fixed top-0 left-0 right-0 h-12 bg-white/95 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-6 z-50 transition-transform duration-300 ${!isVisible ? "-translate-y-full" : "translate-y-0"}`}
		>
			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={onExit}
					className="gap-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
				>
					<X className="h-4 w-4" />
					Exit Presentation
				</Button>
				<div className="h-6 w-px bg-gray-300" />
				<span className="text-sm text-gray-600">
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
						className="cursor-pointer"
					>
						<Minimize2 className="h-4 w-4" />
						Exit Fullscreen
					</Button>
				) : (
					<Button
						variant="ghost"
						size="sm"
						onClick={onEnterFullscreen}
						className="cursor-pointer text-[#a60202] hover:text-[#8a0101] hover:bg-[#a60202]/10"
					>
						<Maximize2 className="h-4 w-4" />
						Enter Fullscreen
					</Button>
				)}
				<Button
					variant="ghost"
					size="sm"
					onClick={onToggleDrawing}
					className={`cursor-pointer gap-2 ${drawingMode ? "bg-blue-100 text-blue-600" : "text-gray-700"}`}
				>
					<Pencil className="h-4 w-4" />
					{drawingMode ? "Drawing..." : "Draw"}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={onTogglePresenter}
					className={`cursor-pointer gap-2 ${presenterView ? "bg-[#a60202]/10 text-[#a60202]" : "text-gray-700"}`}
				>
					<Eye className="h-4 w-4" />
					{presenterView ? "Presenter: ON" : "Presenter: OFF"}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={onToggleMenu}
					className="cursor-pointer"
				>
					<Menu className="h-4 w-4" />
					Menu
				</Button>
			</div>
		</div>
	);
}
