"use client";

import { useCallback, useRef, useState } from "react";

export function usePresentationPointer(drawingChannelName: string) {
	const [pointerMode, setPointerMode] = useState(false);
	const [externalPointerActive, setExternalPointerActive] = useState(false);
	const [pointerPosition, setPointerPosition] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const slideAreaRef = useRef<HTMLDivElement>(null);

	const broadcastPointer = useCallback(
		(x: number, y: number) => {
			const bc = new BroadcastChannel(drawingChannelName);
			bc.postMessage({ type: "pointer-move", x, y });
			bc.close();
		},
		[drawingChannelName],
	);

	const handleSlidePointerMove = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!pointerMode || !slideAreaRef.current) return;
			const rect = slideAreaRef.current.getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width;
			const y = (e.clientY - rect.top) / rect.height;
			if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
				setPointerPosition({ x, y });
				broadcastPointer(x, y);
			} else {
				setPointerPosition(null);
				broadcastPointer(-1, -1);
			}
		},
		[pointerMode, broadcastPointer],
	);

	const handleSlidePointerLeave = useCallback(() => {
		setPointerPosition(null);
		broadcastPointer(-1, -1);
	}, [broadcastPointer]);

	const togglePointerMode = useCallback(
		(deps: { drawingMode: boolean; stopDrawing: () => void }) => {
			// If external pointer is active (from presenter), toggle it off
			if (externalPointerActive) {
				const bc = new BroadcastChannel(drawingChannelName);
				bc.postMessage({ type: "pointer-active", active: false });
				bc.close();
				setExternalPointerActive(false);
				setPointerPosition(null);
				return;
			}

			setPointerMode((prev) => {
				const next = !prev;
				if (next) {
					// Turn off drawing mode if active
					if (deps.drawingMode) {
						deps.stopDrawing();
					}
				} else {
					setPointerPosition(null);
					broadcastPointer(-1, -1);
				}
				const bc = new BroadcastChannel(drawingChannelName);
				bc.postMessage({ type: "pointer-active", active: next });
				bc.close();
				return next;
			});
		},
		[externalPointerActive, drawingChannelName, broadcastPointer],
	);

	const deactivatePointer = useCallback(() => {
		setPointerMode(false);
		setPointerPosition(null);
		broadcastPointer(-1, -1);
		const bc = new BroadcastChannel(drawingChannelName);
		bc.postMessage({ type: "pointer-active", active: false });
		bc.close();
	}, [broadcastPointer, drawingChannelName]);

	return {
		pointerMode,
		setPointerMode,
		externalPointerActive,
		setExternalPointerActive,
		pointerPosition,
		setPointerPosition,
		slideAreaRef,
		broadcastPointer,
		handleSlidePointerMove,
		handleSlidePointerLeave,
		togglePointerMode,
		deactivatePointer,
	};
}
