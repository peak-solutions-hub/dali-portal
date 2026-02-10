"use client";

import { useCallback, useRef, useState } from "react";

export function usePresenterPointer(drawingChannelName: string | undefined) {
	const [pointerMode, setPointerMode] = useState(false);
	const [externalPointerActive, setExternalPointerActive] = useState(false);
	const [pointerPosition, setPointerPosition] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const slideContainerRef = useRef<HTMLDivElement>(null);

	const broadcastPointerFromPresenter = useCallback(
		(x: number, y: number) => {
			if (!drawingChannelName) return;
			const bc = new BroadcastChannel(drawingChannelName);
			bc.postMessage({ type: "pointer-move", x, y, origin: "presenter" });
			bc.close();
		},
		[drawingChannelName],
	);

	const handlePresenterPointerMove = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (!pointerMode || !slideContainerRef.current) return;
			const rect = slideContainerRef.current.getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width;
			const y = (e.clientY - rect.top) / rect.height;
			if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
				setPointerPosition({ x, y });
				broadcastPointerFromPresenter(x, y);
			} else {
				setPointerPosition(null);
				broadcastPointerFromPresenter(-1, -1);
			}
		},
		[pointerMode, broadcastPointerFromPresenter],
	);

	const handlePresenterPointerLeave = useCallback(() => {
		if (!pointerMode) return;
		setPointerPosition(null);
		broadcastPointerFromPresenter(-1, -1);
	}, [pointerMode, broadcastPointerFromPresenter]);

	const togglePresenterPointerMode = useCallback(
		(deps: { drawingMode: boolean; stopDrawing: () => void }) => {
			if (externalPointerActive) {
				if (drawingChannelName) {
					const bc = new BroadcastChannel(drawingChannelName);
					bc.postMessage({
						type: "pointer-active",
						active: false,
						origin: "presenter",
					});
					bc.close();
				}
				setExternalPointerActive(false);
				setPointerPosition(null);
				return;
			}

			setPointerMode((prev) => {
				const next = !prev;
				if (next) {
					if (deps.drawingMode) {
						deps.stopDrawing();
					}
				} else {
					setPointerPosition(null);
					broadcastPointerFromPresenter(-1, -1);
				}
				if (drawingChannelName) {
					const bc = new BroadcastChannel(drawingChannelName);
					bc.postMessage({
						type: "pointer-active",
						active: next,
						origin: "presenter",
					});
					bc.close();
				}
				return next;
			});
		},
		[externalPointerActive, drawingChannelName, broadcastPointerFromPresenter],
	);

	const deactivatePointer = useCallback(() => {
		setPointerMode(false);
		setPointerPosition(null);
		broadcastPointerFromPresenter(-1, -1);
		if (drawingChannelName) {
			const bc = new BroadcastChannel(drawingChannelName);
			bc.postMessage({
				type: "pointer-active",
				active: false,
				origin: "presenter",
			});
			bc.close();
		}
	}, [broadcastPointerFromPresenter, drawingChannelName]);

	return {
		pointerMode,
		setPointerMode,
		externalPointerActive,
		setExternalPointerActive,
		pointerPosition,
		setPointerPosition,
		slideContainerRef,
		broadcastPointerFromPresenter,
		handlePresenterPointerMove,
		handlePresenterPointerLeave,
		togglePresenterPointerMode,
		deactivatePointer,
	};
}
