"use client";

import { Button } from "@repo/ui/components/button";
import {
	Maximize2,
	Menu,
	Minimize2,
	Monitor,
	X,
} from "@repo/ui/lib/lucide-react";

export function PresenterTopBar({
	sessionNumber,
	isFullscreen,
	onEnterFullscreen,
	onExitFullscreen,
	showNavMenu,
	onToggleNavMenu,
	onEndShow,
}: {
	sessionNumber?: string;
	isFullscreen: boolean;
	onEnterFullscreen: () => void;
	onExitFullscreen: () => void;
	showNavMenu: boolean;
	onToggleNavMenu: () => void;
	onEndShow?: () => void;
}) {
	return (
		<div className="h-10 bg-black/80 backdrop-blur-sm flex items-center justify-between px-4">
			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={onToggleNavMenu}
					className={`cursor-pointer gap-1.5 text-xs h-7 px-2 transition-all ${showNavMenu ? "bg-yellow-500 text-gray-900 hover:bg-yellow-400" : "text-white/80 hover:text-white hover:bg-white/10"}`}
				>
					<Menu className="h-3.5 w-3.5" />
					SHOW TASKBAR
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="cursor-pointer gap-1.5 text-xs h-7 px-2 text-white/80 hover:text-white hover:bg-white/10"
				>
					<Monitor className="h-3.5 w-3.5" />
					DISPLAY SETTINGS
				</Button>
			</div>
			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={onEndShow ?? (() => window.close())}
					className="cursor-pointer gap-1.5 text-xs h-7 px-3 border border-red-500/50 text-red-400 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all"
				>
					<X className="h-3.5 w-3.5" />
					END SLIDE SHOW
				</Button>
				{isFullscreen ? (
					<Button
						variant="ghost"
						size="sm"
						onClick={onExitFullscreen}
						className="cursor-pointer text-xs h-7 px-2 text-white/80 hover:text-white hover:bg-white/10"
					>
						<Minimize2 className="h-3.5 w-3.5" />
					</Button>
				) : (
					<Button
						variant="ghost"
						size="sm"
						onClick={onEnterFullscreen}
						className="cursor-pointer text-xs h-7 px-2 text-white/80 hover:text-white hover:bg-white/10"
					>
						<Maximize2 className="h-3.5 w-3.5" />
					</Button>
				)}
			</div>
		</div>
	);
}
