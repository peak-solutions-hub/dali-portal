"use client";

import { useCallback, useRef, useState } from "react";

export function usePresenterWindow(
	sessionNumber: string,
	drawingChannelName: string,
) {
	const [presenterView, setPresenterView] = useState(false);
	const [presenterWindow, setPresenterWindow] = useState<Window | null>(null);
	const presenterAckedRef = useRef(false);

	const openPresenterWindow = useCallback(() => {
		presenterAckedRef.current = false;
		const url = `/session-presenter?session=${encodeURIComponent(sessionNumber)}`;

		let w: Window | null = null;
		try {
			w = window.open(
				url,
				`dali-presenter-${sessionNumber}`,
				"noopener,noreferrer,width=1280,height=720",
			);
		} catch {
			// ignore
		}

		if (w && !w.closed) {
			setPresenterWindow(w);
			setPresenterView(true);
			presenterAckedRef.current = true;
			return;
		}

		try {
			w = window.open(url, "_blank");
		} catch {
			// ignore
		}

		if (w && !w.closed) {
			setPresenterWindow(w);
			setPresenterView(true);
			presenterAckedRef.current = true;
		}
	}, [sessionNumber]);

	const togglePresenterWindow = useCallback(() => {
		if (document.fullscreenElement) {
			try {
				document.exitFullscreen();
			} catch {
				// ignore
			}
		}
		if (presenterWindow && !presenterWindow.closed) {
			presenterWindow.close();
			setPresenterWindow(null);
			setPresenterView(false);
			return;
		}
		if (presenterView) {
			try {
				const bc = new BroadcastChannel(drawingChannelName);
				bc.postMessage({ type: "presenter-window-close-request" });
				bc.close();
			} catch {
				// ignore
			}
			setPresenterView(false);
			setPresenterWindow(null);
			presenterAckedRef.current = false;
			return;
		}
		openPresenterWindow();
	}, [drawingChannelName, openPresenterWindow, presenterView, presenterWindow]);

	return {
		presenterView,
		setPresenterView,
		presenterWindow,
		setPresenterWindow,
		presenterAckedRef,
		togglePresenterWindow,
	};
}
