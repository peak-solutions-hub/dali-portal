"use client";

import { useCallback, useEffect, useState } from "react";

export function useFullscreen() {
	const [isFullscreen, setIsFullscreen] = useState(false);

	const enterFullscreen = useCallback(async () => {
		try {
			await document.documentElement.requestFullscreen();
			setIsFullscreen(true);
		} catch (err) {
			console.error(err);
		}
	}, []);

	const exitFullscreen = useCallback(async () => {
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			setIsFullscreen(false);
		} catch (err) {
			console.error(err);
		}
	}, []);

	useEffect(() => {
		const onFull = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener("fullscreenchange", onFull);
		return () => document.removeEventListener("fullscreenchange", onFull);
	}, []);

	return { isFullscreen, enterFullscreen, exitFullscreen };
}
