"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
	interface Window {
		turnstile?: {
			render: (
				container: string | HTMLElement,
				options: TurnstileOptions,
			) => string;
			reset: (widgetId: string) => void;
			remove: (widgetId: string) => void;
			getResponse: (widgetId: string) => string | undefined;
			isExpired: (widgetId: string) => boolean;
		};
	}
}

interface TurnstileOptions {
	sitekey: string;
	callback?: (token: string) => void;
	"error-callback"?: () => void;
	"expired-callback"?: () => void;
	theme?: "light" | "dark" | "auto";
	size?: "normal" | "flexible" | "compact";
	action?: string;
}

interface TurnstileWidgetProps {
	siteKey: string;
	onVerify: (token: string) => void;
	onError?: () => void;
	onExpire?: () => void;
	theme?: "light" | "dark" | "auto";
	size?: "normal" | "flexible" | "compact";
	action?: string;
	className?: string;
}

export function TurnstileWidget({
	siteKey,
	onVerify,
	onError,
	onExpire,
	theme = "auto",
	size = "normal",
	action,
	className,
}: TurnstileWidgetProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | null>(null);
	const [isScriptLoaded, setIsScriptLoaded] = useState(false);

	const renderWidget = useCallback(() => {
		if (!window.turnstile || !containerRef.current || widgetIdRef.current) {
			return;
		}

		// Clear container before rendering
		containerRef.current.innerHTML = "";

		widgetIdRef.current = window.turnstile.render(containerRef.current, {
			sitekey: siteKey,
			callback: onVerify,
			"error-callback": onError,
			"expired-callback": onExpire,
			theme,
			size,
			action,
		});
	}, [siteKey, onVerify, onError, onExpire, theme, size, action]);

	// Render widget when script loads
	useEffect(() => {
		if (isScriptLoaded) {
			renderWidget();
		}
	}, [isScriptLoaded, renderWidget]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (widgetIdRef.current && window.turnstile) {
				window.turnstile.remove(widgetIdRef.current);
				widgetIdRef.current = null;
			}
		};
	}, []);

	return (
		<>
			{/* Load Turnstile script with explicit rendering mode */}
			<Script
				src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
				strategy="lazyOnload"
				onLoad={() => setIsScriptLoaded(true)}
			/>

			{/* Widget container */}
			<div ref={containerRef} className={className} />
		</>
	);
}

/**
 * Hook to reset the Turnstile widget programmatically.
 * Useful when form submission fails and you need a fresh token.
 */
export function useTurnstileReset() {
	return useCallback((widgetId: string) => {
		if (window.turnstile) {
			window.turnstile.reset(widgetId);
		}
	}, []);
}
