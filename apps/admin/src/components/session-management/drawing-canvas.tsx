"use client";

import { Button } from "@repo/ui/components/button";
import { Eraser, Pencil, Trash2, X } from "@repo/ui/lib/lucide-react";
import React, { useCallback, useEffect } from "react";

// A canvas that optionally exposes a clearCanvas method used by the drawing toolbar
type ClearableCanvas = HTMLCanvasElement & { clearCanvas?: () => void };

export function DrawingCanvas({
	isEraser,
	onToggleEraser,
	onClear,
	onExit,
}: {
	isEraser: boolean;
	onToggleEraser: () => void;
	onClear: () => void;
	onExit: () => void;
}) {
	const canvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		let isDrawing = false;

		const startDrawing = (e: MouseEvent) => {
			isDrawing = true;
			ctx.beginPath();
			ctx.moveTo(e.clientX, e.clientY);
		};

		const draw = (e: MouseEvent) => {
			if (!isDrawing) return;
			ctx.lineTo(e.clientX, e.clientY);
			const currentIsEraser = canvas.dataset.isEraser === "true";

			if (currentIsEraser) {
				ctx.globalCompositeOperation = "destination-out";
				ctx.lineWidth = 30;
				ctx.strokeStyle = "rgba(0,0,0,1)";
			} else {
				ctx.globalCompositeOperation = "source-over";
				ctx.strokeStyle = "#ef4444";
				ctx.lineWidth = 3;
			}

			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(e.clientX, e.clientY);
		};

		const stopDrawing = () => {
			isDrawing = false;
			ctx.beginPath();
		};

		canvas.addEventListener("mousedown", startDrawing);
		canvas.addEventListener("mousemove", draw);
		canvas.addEventListener("mouseup", stopDrawing);
		canvas.addEventListener("mouseleave", stopDrawing);

		(canvas as ClearableCanvas).clearCanvas = () =>
			ctx.clearRect(0, 0, canvas.width, canvas.height);

		return () => {
			canvas.removeEventListener("mousedown", startDrawing);
			canvas.removeEventListener("mousemove", draw);
			canvas.removeEventListener("mouseup", stopDrawing);
			canvas.removeEventListener("mouseleave", stopDrawing);
		};
	}, []);

	const handleClear = () => {
		const canvas = document.querySelector<HTMLCanvasElement>("canvas");
		const clearable = canvas as ClearableCanvas | null;
		if (clearable && clearable.clearCanvas) clearable.clearCanvas();
		onClear();
	};

	useEffect(() => {
		const canvas = document.querySelector<HTMLCanvasElement>("canvas");
		if (canvas) canvas.dataset.isEraser = String(isEraser);
	}, [isEraser]);

	return (
		<>
			<canvas
				ref={canvasRef}
				data-is-eraser={String(isEraser)}
				className={`fixed inset-0 z-60 ${isEraser ? "cursor-cell" : "cursor-crosshair"}`}
				style={{ pointerEvents: "auto" }}
			/>

			<div className="fixed top-20 right-6 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-70 space-y-2">
				<div className="text-xs font-semibold text-gray-700 mb-3">
					Drawing Tools
				</div>

				<div className="flex gap-2">
					<Button
						variant={!isEraser ? "default" : "ghost"}
						size="sm"
						onClick={() => isEraser && onToggleEraser()}
						className={`flex-1 justify-center gap-2 cursor-pointer ${!isEraser ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
					>
						<Pencil className="h-4 w-4" />
						Pen
					</Button>
					<Button
						variant={isEraser ? "default" : "ghost"}
						size="sm"
						onClick={() => !isEraser && onToggleEraser()}
						className={`flex-1 justify-center gap-2 cursor-pointer ${isEraser ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
					>
						<Eraser className="h-4 w-4" />
						Eraser
					</Button>
				</div>

				<Button
					variant="ghost"
					size="sm"
					onClick={handleClear}
					className="w-full justify-start gap-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
				>
					<Trash2 className="h-4 w-4" />
					Clear All
				</Button>

				<div className="border-t border-gray-200 my-2" />

				<Button
					variant="ghost"
					size="sm"
					onClick={onExit}
					className="w-full justify-start gap-2 cursor-pointer"
				>
					<X className="h-4 w-4" />
					Done Drawing
				</Button>

				<div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
					<div>
						Press{" "}
						<kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
							E
						</kbd>{" "}
						to toggle eraser
					</div>
					<div className="mt-1">
						Press{" "}
						<kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
							D
						</kbd>{" "}
						to exit drawing
					</div>
				</div>
			</div>
		</>
	);
}
