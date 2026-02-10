"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAutoHideBars(deps: {
	showNavMenu: boolean;
	drawingMode: boolean;
}) {
	const { showNavMenu, drawingMode } = deps;
	const [topBarHovered, setTopBarHovered] = useState(false);
	const [bottomBarHovered, setBottomBarHovered] = useState(false);
	const topBarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const bottomBarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const EDGE_THRESHOLD = 50;
		const HIDE_DELAY = 1000;

		const handleMouseMove = (e: MouseEvent) => {
			const windowHeight = window.innerHeight;

			// Top bar logic
			if (e.clientY <= EDGE_THRESHOLD) {
				if (topBarTimeoutRef.current) {
					clearTimeout(topBarTimeoutRef.current);
					topBarTimeoutRef.current = null;
				}
				setTopBarHovered(true);
			} else if (
				e.clientY > EDGE_THRESHOLD + 10 &&
				!showNavMenu &&
				!drawingMode
			) {
				if (topBarTimeoutRef.current) {
					clearTimeout(topBarTimeoutRef.current);
				}
				topBarTimeoutRef.current = setTimeout(() => {
					setTopBarHovered(false);
				}, HIDE_DELAY);
			}

			// Bottom bar logic
			if (e.clientY >= windowHeight - EDGE_THRESHOLD) {
				if (bottomBarTimeoutRef.current) {
					clearTimeout(bottomBarTimeoutRef.current);
					bottomBarTimeoutRef.current = null;
				}
				setBottomBarHovered(true);
			} else if (
				e.clientY < windowHeight - EDGE_THRESHOLD - 10 &&
				!showNavMenu &&
				!drawingMode
			) {
				if (bottomBarTimeoutRef.current) {
					clearTimeout(bottomBarTimeoutRef.current);
				}
				bottomBarTimeoutRef.current = setTimeout(() => {
					setBottomBarHovered(false);
				}, HIDE_DELAY);
			}
		};

		document.addEventListener("mousemove", handleMouseMove);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			if (topBarTimeoutRef.current) clearTimeout(topBarTimeoutRef.current);
			if (bottomBarTimeoutRef.current)
				clearTimeout(bottomBarTimeoutRef.current);
		};
	}, [showNavMenu, drawingMode]);

	return { topBarHovered, bottomBarHovered };
}
