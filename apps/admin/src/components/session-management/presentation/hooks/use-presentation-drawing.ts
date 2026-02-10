"use client";

import { useCallback, useRef, useState } from "react";

export function usePresentationDrawing(
	drawingChannelName: string,
	sessionNumber: string,
) {
	const [drawingMode, setDrawingMode] = useState(false);
	const [isEraser, setIsEraser] = useState(false);
	const [drawingController, setDrawingController] = useState<
		"presentation" | "presenter" | null
	>(null);

	const postPresentationDrawing = useCallback(
		(nextActive: boolean) => {
			const bc = new BroadcastChannel(drawingChannelName);
			bc.postMessage({
				type: "presenter-drawing",
				active: nextActive,
				origin: "presentation",
			});
			if (!nextActive) {
				bc.postMessage({
					type: "drawing-clear",
					sourceId: `presentation-${sessionNumber}-toggle-off`,
				});
			}
			bc.close();
		},
		[drawingChannelName, sessionNumber],
	);

	const clearCanvas = useCallback(() => {
		const bc = new BroadcastChannel(drawingChannelName);
		bc.postMessage({
			type: "drawing-clear",
			sourceId: `presentation-${sessionNumber}-clear`,
		});
		bc.close();
	}, [drawingChannelName, sessionNumber]);

	const stopDrawing = useCallback(() => {
		setDrawingMode(false);
		setIsEraser(false);
		setDrawingController(null);
		postPresentationDrawing(false);
	}, [postPresentationDrawing]);

	const startDrawing = useCallback(
		(controller: "presentation" | "presenter") => {
			setDrawingMode(true);
			setIsEraser(false);
			setDrawingController(controller);
			postPresentationDrawing(true);
		},
		[postPresentationDrawing],
	);

	return {
		drawingMode,
		setDrawingMode,
		isEraser,
		setIsEraser,
		drawingController,
		setDrawingController,
		postPresentationDrawing,
		clearCanvas,
		stopDrawing,
		startDrawing,
	};
}
