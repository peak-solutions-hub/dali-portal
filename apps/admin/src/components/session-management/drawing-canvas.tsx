"use client";

import { Button } from "@repo/ui/components/button";
import { Eraser, Pencil, Trash2, X } from "@repo/ui/lib/lucide-react";
import React, { useCallback, useEffect, useRef } from "react";

// A canvas that optionally exposes a clearCanvas method used by the drawing toolbar
type ClearableCanvas = HTMLCanvasElement & { clearCanvas?: () => void };

export function DrawingCanvas({
	channelName,
	active = true,
	isEraser,
	onToggleEraser,
	onClear,
	onExit,
	insetTop = 0,
	insetRight = 0,
	insetBottom = 0,
	insetLeft = 0,
}: {
	channelName?: string;
	active?: boolean;
	isEraser: boolean;
	onToggleEraser?: () => void;
	onClear?: () => void;
	onExit?: () => void;
	insetTop?: number;
	insetRight?: number;
	insetBottom?: number;
	insetLeft?: number;
}) {
	const canvasElRef = useRef<HTMLCanvasElement | null>(null);
	const activeRef = useRef(active);
	const instanceIdRef = useRef<string>(
		typeof crypto !== "undefined" && "randomUUID" in crypto
			? crypto.randomUUID()
			: String(Math.random()),
	);
	const strokesRef = useRef<
		Array<{ points: Array<{ x: number; y: number }>; isEraser: boolean }>
	>([]);
	const receivedInitialStateRef = useRef(false);

	useEffect(() => {
		activeRef.current = active;
	}, [active]);

	const clearLocal = useCallback(() => {
		const canvas = canvasElRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}, []);

	const redrawFromStrokes = useCallback(() => {
		const canvas = canvasElRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		for (const stroke of strokesRef.current) {
			const pts = stroke.points;
			if (!pts || pts.length < 2) continue;
			const first = pts[0];
			if (!first) continue;

			ctx.beginPath();
			ctx.moveTo(first.x * canvas.width, first.y * canvas.height);
			for (let i = 1; i < pts.length; i++) {
				const p = pts[i];
				if (!p) continue;
				ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
			}

			if (stroke.isEraser) {
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
		}
	}, []);

	const canvasRef = useCallback(
		(canvas: HTMLCanvasElement | null) => {
			if (!canvas) return;
			canvasElRef.current = canvas;

			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			const resize = () => {
				canvas.width = Math.max(0, window.innerWidth - insetLeft - insetRight);
				canvas.height = Math.max(
					0,
					window.innerHeight - insetTop - insetBottom,
				);
				receivedInitialStateRef.current = false;
				redrawFromStrokes();
			};
			resize();

			let isDrawing = false;

			let pendingStroke: Array<{ x: number; y: number }> = [];

			const startDrawing = (e: MouseEvent) => {
				if (!activeRef.current) return;
				isDrawing = true;
				ctx.beginPath();
				ctx.moveTo(e.clientX - insetLeft, e.clientY - insetTop);
				pendingStroke = [];
				if (canvas.width > 0 && canvas.height > 0) {
					pendingStroke.push({
						x: (e.clientX - insetLeft) / canvas.width,
						y: (e.clientY - insetTop) / canvas.height,
					});
				}
			};

			const draw = (e: MouseEvent) => {
				if (!activeRef.current) return;
				if (!isDrawing) return;
				ctx.lineTo(e.clientX - insetLeft, e.clientY - insetTop);
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
				ctx.moveTo(e.clientX - insetLeft, e.clientY - insetTop);
				if (canvas.width > 0 && canvas.height > 0) {
					pendingStroke.push({
						x: (e.clientX - insetLeft) / canvas.width,
						y: (e.clientY - insetTop) / canvas.height,
					});
				}
			};

			const stopDrawing = () => {
				if (!activeRef.current) return;
				isDrawing = false;
				ctx.beginPath();
				if (pendingStroke.length >= 2) {
					const stroke = {
						points: pendingStroke,
						isEraser: canvas.dataset.isEraser === "true",
					};
					strokesRef.current = [...strokesRef.current, stroke];
					if (channelName) {
						const bc = new BroadcastChannel(channelName);
						bc.postMessage({
							type: "drawing-stroke",
							sourceId: instanceIdRef.current,
							stroke,
						});
						bc.close();
					}
				}
			};

			canvas.addEventListener("mousedown", startDrawing);
			canvas.addEventListener("mousemove", draw);
			canvas.addEventListener("mouseup", stopDrawing);
			canvas.addEventListener("mouseleave", stopDrawing);
			window.addEventListener("resize", resize);

			(canvas as ClearableCanvas).clearCanvas = () =>
				ctx.clearRect(0, 0, canvas.width, canvas.height);

			return () => {
				canvas.removeEventListener("mousedown", startDrawing);
				canvas.removeEventListener("mousemove", draw);
				canvas.removeEventListener("mouseup", stopDrawing);
				canvas.removeEventListener("mouseleave", stopDrawing);
				window.removeEventListener("resize", resize);
			};
		},
		[
			channelName,
			insetBottom,
			insetLeft,
			insetRight,
			insetTop,
			redrawFromStrokes,
		],
	);

	const handleClear = () => {
		const clearable = canvasElRef.current as ClearableCanvas | null;
		if (clearable && clearable.clearCanvas) clearable.clearCanvas();
		strokesRef.current = [];
		if (channelName) {
			const bc = new BroadcastChannel(channelName);
			bc.postMessage({
				type: "drawing-clear",
				sourceId: instanceIdRef.current,
			});
			bc.close();
		}
		onClear?.();
	};

	useEffect(() => {
		const canvas = canvasElRef.current;
		if (canvas) canvas.dataset.isEraser = String(isEraser);
	}, [isEraser]);

	useEffect(() => {
		if (!channelName) return;
		const bc = new BroadcastChannel(channelName);

		const onMessage = (ev: MessageEvent) => {
			const msg = ev.data;
			if (!msg || !msg.type) return;
			if (
				msg.type !== "drawing-clear" &&
				msg.sourceId &&
				msg.sourceId === instanceIdRef.current
			)
				return;

			switch (msg.type) {
				case "drawing-clear": {
					strokesRef.current = [];
					clearLocal();
					break;
				}
				case "drawing-stroke": {
					const stroke = msg.stroke as
						| { points: Array<{ x: number; y: number }>; isEraser: boolean }
						| undefined;
					if (!stroke || !Array.isArray(stroke.points)) return;
					strokesRef.current = [...strokesRef.current, stroke];
					redrawFromStrokes();
					break;
				}
				case "drawing-request-state": {
					if (!msg.requestId) return;
					const bc2 = new BroadcastChannel(channelName);
					bc2.postMessage({
						type: "drawing-state",
						sourceId: instanceIdRef.current,
						requestId: msg.requestId,
						strokes: strokesRef.current,
					});
					bc2.close();
					break;
				}
				case "drawing-state": {
					if (!msg.requestId) return;
					if (receivedInitialStateRef.current) return;
					receivedInitialStateRef.current = true;
					if (Array.isArray(msg.strokes)) {
						strokesRef.current = msg.strokes;
						redrawFromStrokes();
					}
					break;
				}
				default:
					break;
			}
		};

		bc.addEventListener("message", onMessage);
		const requestId =
			typeof crypto !== "undefined" && "randomUUID" in crypto
				? crypto.randomUUID()
				: String(Math.random());
		bc.postMessage({ type: "drawing-request-state", requestId });

		return () => {
			bc.removeEventListener("message", onMessage);
			bc.close();
		};
	}, [channelName, clearLocal, redrawFromStrokes]);

	return (
		<>
			<canvas
				ref={canvasRef}
				data-is-eraser={String(isEraser)}
				className={`fixed z-60 ${isEraser ? "cursor-cell" : "cursor-crosshair"}`}
				style={{
					pointerEvents: active ? "auto" : "none",
					top: insetTop,
					right: insetRight,
					bottom: insetBottom,
					left: insetLeft,
				}}
			/>

			{active && (
				<div className="fixed top-14 right-6 bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-200 p-3 z-70 space-y-2 max-w-56">
					<div className="text-xs font-semibold text-gray-700 mb-3">
						Drawing Tools
					</div>

					<div className="flex gap-2">
						<Button
							variant={!isEraser ? "default" : "ghost"}
							size="sm"
							onClick={() => isEraser && onToggleEraser?.()}
							className={`flex-1 justify-center gap-2 cursor-pointer ${!isEraser ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
						>
							<Pencil className="h-4 w-4" />
							Pen
						</Button>
						<Button
							variant={isEraser ? "default" : "ghost"}
							size="sm"
							onClick={() => !isEraser && onToggleEraser?.()}
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
						onClick={() => onExit?.()}
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
			)}
		</>
	);
}
