"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function usePresentationTimer() {
	const [currentTime, setCurrentTime] = useState(new Date());
	const startTimeRef = useRef(new Date());
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			const now = new Date();
			setCurrentTime(now);
			setElapsedSeconds(
				Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000),
			);
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	const formatElapsed = useCallback((seconds: number): string => {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		if (h > 0) {
			return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
		}
		return `${m}:${String(s).padStart(2, "0")}`;
	}, []);

	return { currentTime, elapsedSeconds, formatElapsed };
}
