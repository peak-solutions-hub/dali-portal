"use client";

import { useCallback, useRef, useState } from "react";

export function usePresenterDrawing(
	drawingChannelName: string | undefined,
	sessionNumber: string | undefined,
) {
	const [drawingMode, setDrawingMode] = useState(false);
	const [isEraser, setIsEraser] = useState(false);
	const [showDrawingTools, setShowDrawingTools] = useState(false);
	const [externalDrawingActive, setExternalDrawingActive] = useState(false);
	const drawingButtonRef = useRef<HTMLButtonElement>(null);

	const postPresenterDrawing = useCallback(
		(nextActive: boolean) => {
			if (!drawingChannelName) return;
			const bc = new BroadcastChannel(drawingChannelName);
			bc.postMessage({
				type: "presenter-drawing",
				active: nextActive,
				origin: "presenter",
			});
			if (!nextActive) {
				bc.postMessage({
					type: "drawing-clear",
					sourceId: `presenter-${sessionNumber ?? "unknown"}-toggle-off`,
				});
			}
			bc.close();
		},
		[drawingChannelName, sessionNumber],
	);

	const clearCanvas = useCallback(() => {
		if (!drawingChannelName) return;
		const bc = new BroadcastChannel(drawingChannelName);
		bc.postMessage({
			type: "drawing-clear",
			sourceId: `presenter-${sessionNumber ?? "unknown"}-clear`,
		});
		bc.close();
	}, [drawingChannelName, sessionNumber]);

	const stopDrawing = useCallback(() => {
		postPresenterDrawing(false);
		setDrawingMode(false);
		setIsEraser(false);
		setShowDrawingTools(false);
	}, [postPresenterDrawing]);

	const startDrawing = useCallback(() => {
		setDrawingMode(true);
		setIsEraser(false);
		postPresenterDrawing(true);
		setShowDrawingTools(true);
	}, [postPresenterDrawing]);

	return {
		drawingMode,
		setDrawingMode,
		isEraser,
		setIsEraser,
		showDrawingTools,
		setShowDrawingTools,
		externalDrawingActive,
		setExternalDrawingActive,
		drawingButtonRef,
		postPresenterDrawing,
		clearCanvas,
		stopDrawing,
		startDrawing,
	};
}
