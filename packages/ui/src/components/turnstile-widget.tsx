"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export interface TurnstileWidgetRef {
	/** Get the current token, or undefined if not verified */
	getToken: () => string | undefined;
	/** Reset the widget to get a new token */
	reset: () => void;
	/** Check if a valid token exists */
	isVerified: () => boolean;
}

export interface TurnstileWidgetProps {
	/** Turnstile site key from environment */
	siteKey?: string;
	/** Called when verification succeeds with the token */
	onVerify?: (token: string) => void;
	/** Called when verification expires */
	onExpire?: () => void;
	/** Called on error */
	onError?: () => void;
	/** Theme preference */
	theme?: "light" | "dark" | "auto";
	/** Widget size */
	size?: "normal" | "flexible" | "compact";
	/** Optional action for analytics */
	action?: string;
	/** Additional CSS class */
	className?: string;
}

/**
 * Turnstile captcha widget using @marsidev/react-turnstile.
 *
 * @example
 * ```tsx
 * const turnstileRef = useRef<TurnstileWidgetRef>(null);
 *
 * const handleSubmit = async () => {
 *   const token = turnstileRef.current?.getToken();
 *   if (!token) {
 *     alert("Please complete the captcha");
 *     return;
 *   }
 *
 *   const result = await api.submit({ captchaToken: token, ...data });
 *
 *   if (result.error) {
 *     turnstileRef.current?.reset(); // Get fresh token for retry
 *   }
 * };
 *
 * return (
 *   <form onSubmit={handleSubmit}>
 *     <TurnstileWidget ref={turnstileRef} />
 *     <button type="submit">Submit</button>
 *   </form>
 * );
 * ```
 */
export const TurnstileWidget = forwardRef<
	TurnstileWidgetRef,
	TurnstileWidgetProps
>(function TurnstileWidget(
	{
		siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
		onVerify,
		onExpire,
		onError,
		theme = "auto",
		size = "normal",
		action,
		className,
	},
	ref,
) {
	const turnstileRef = useRef<TurnstileInstance>(null);
	const [token, setToken] = useState<string | undefined>(undefined);

	useImperativeHandle(ref, () => ({
		getToken: () => token,
		reset: () => {
			turnstileRef.current?.reset();
			setToken(undefined);
		},
		isVerified: () => !!token,
	}));

	const handleVerify = (newToken: string) => {
		setToken(newToken);
		onVerify?.(newToken);
	};

	const handleExpire = () => {
		setToken(undefined);
		onExpire?.();
	};

	const handleError = () => {
		setToken(undefined);
		onError?.();
	};

	if (!siteKey) {
		console.error(
			"TurnstileWidget: Missing NEXT_PUBLIC_TURNSTILE_SITE_KEY env variable",
		);
		return null;
	}

	return (
		<div className={className}>
			<Turnstile
				ref={turnstileRef}
				siteKey={siteKey}
				onSuccess={handleVerify}
				onExpire={handleExpire}
				onError={handleError}
				options={{
					theme,
					size,
					action,
				}}
			/>
		</div>
	);
});

export default TurnstileWidget;
