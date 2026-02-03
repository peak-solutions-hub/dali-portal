"use client";

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
	containedMode = false,
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
	containedMode?: boolean;
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
				ctx.strokeStyle = "#ffffff";
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
				if (containedMode && canvas.parentElement) {
					// Use parent container dimensions for contained mode
					const parent = canvas.parentElement;
					canvas.width = parent.clientWidth;
					canvas.height = parent.clientHeight;
				} else {
					canvas.width = Math.max(
						0,
						window.innerWidth - insetLeft - insetRight,
					);
					canvas.height = Math.max(
						0,
						window.innerHeight - insetTop - insetBottom,
					);
				}
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

				let x: number, y: number;
				if (containedMode) {
					const rect = canvas.getBoundingClientRect();
					x = e.clientX - rect.left;
					y = e.clientY - rect.top;
				} else {
					x = e.clientX - insetLeft;
					y = e.clientY - insetTop;
				}

				ctx.moveTo(x, y);
				pendingStroke = [];
				if (canvas.width > 0 && canvas.height > 0) {
					pendingStroke.push({
						x: x / canvas.width,
						y: y / canvas.height,
					});
				}
			};

			const draw = (e: MouseEvent) => {
				if (!activeRef.current) return;
				if (!isDrawing) return;

				let x: number, y: number;
				if (containedMode) {
					const rect = canvas.getBoundingClientRect();
					x = e.clientX - rect.left;
					y = e.clientY - rect.top;
				} else {
					x = e.clientX - insetLeft;
					y = e.clientY - insetTop;
				}

				ctx.lineTo(x, y);
				const currentIsEraser = canvas.dataset.isEraser === "true";

				if (currentIsEraser) {
					ctx.globalCompositeOperation = "destination-out";
					ctx.lineWidth = 30;
					ctx.strokeStyle = "rgba(0,0,0,1)";
				} else {
					ctx.globalCompositeOperation = "source-over";
					ctx.strokeStyle = "#ffffff";
					ctx.lineWidth = 3;
				}

				ctx.lineCap = "round";
				ctx.lineJoin = "round";
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(x, y);
				if (canvas.width > 0 && canvas.height > 0) {
					pendingStroke.push({
						x: x / canvas.width,
						y: y / canvas.height,
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
			containedMode,
			insetBottom,
			insetLeft,
			insetRight,
			insetTop,
			redrawFromStrokes,
		],
	);

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
		<canvas
			ref={canvasRef}
			data-is-eraser={String(isEraser)}
			className={`${containedMode ? "absolute inset-0" : "fixed"} z-40 ${isEraser ? "cursor-cell" : "cursor-crosshair"}`}
			style={{
				pointerEvents: active ? "auto" : "none",
				...(containedMode
					? {}
					: {
							top: insetTop,
							right: insetRight,
							bottom: insetBottom,
							left: insetLeft,
						}),
			}}
		/>
	);
}
