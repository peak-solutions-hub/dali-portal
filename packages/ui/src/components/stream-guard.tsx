"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { isNetworkError } from "../lib/is-network-error";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StreamGuardProps {
	/** Content to protect against mid-stream network failures. */
	children: ReactNode;
	/**
	 * Rendered when a network error is intercepted.
	 * Use the shared `<OfflineUI />` component here so the design stays in
	 * sync with `OfflineAwareSuspense`.
	 */
	fallback: ReactNode;
	/**
	 * Optional callback invoked in `componentDidCatch` for **real** (non-network)
	 * errors. Use this to send error reports to your monitoring service.
	 *
	 * Network errors are intentionally suppressed and never forwarded here.
	 */
	onError?: (error: Error, info: ErrorInfo) => void;
}

interface StreamGuardState {
	/** True when a genuine (non-network) error was caught — re-throws to parent. */
	hasError: boolean;
	/** True when a network error was intercepted — renders `fallback`. */
	isOfflineError: boolean;
	/** The original real error, stored for re-throwing in `render()`. */
	error: Error | null;
}

// ---------------------------------------------------------------------------
// StreamGuard
// ---------------------------------------------------------------------------

/**
 * Class-based React error boundary that intercepts mid-stream **network
 * failures** before Next.js's own error boundary sees them, preventing the
 * generic error page from flashing over the offline fallback UI.
 *
 * Behaviour
 * ----------
 * - **Network error** → shows `fallback` (e.g. `<OfflineUI />`). When
 *   connectivity is restored, automatically reloads the page because SSR
 *   streams cannot resume without a new request.
 * - **Real error** → re-throws in `render()` so it surfaces to the parent
 *   error boundary (Next.js's `error.tsx` / `global-error.tsx`) normally.
 *
 * Placement
 * ----------
 * Mount `StreamGuard` in `app/layout.tsx` around `{children}`. This makes it
 * the outermost React error boundary in the tree, so it can intercept
 * streaming failures before any inner Next.js error boundary processes them.
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * import { StreamGuard } from "@repo/ui/components/stream-guard";
 * import { OfflineUI } from "@repo/ui/components/offline-ui";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <StreamGuard fallback={<OfflineUI />}>
 *           {children}
 *         </StreamGuard>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export class StreamGuard extends Component<StreamGuardProps, StreamGuardState> {
	// Explicit displayName ensures the correct name appears in React DevTools and
	// error stack traces even after minification strips the class identifier.
	static displayName = "StreamGuard";

	state: StreamGuardState = {
		hasError: false,
		isOfflineError: false,
		error: null,
	};

	// -------------------------------------------------------------------------
	// Static lifecycle — runs synchronously before render
	// -------------------------------------------------------------------------

	static getDerivedStateFromError(error: Error): StreamGuardState {
		if (isNetworkError(error)) {
			// Intercept — do NOT surface to Next.js's error boundary.
			return { hasError: false, isOfflineError: true, error: null };
		}

		// Real application error — store it so render() can re-throw.
		return { hasError: true, isOfflineError: false, error };
	}

	// -------------------------------------------------------------------------
	// Instance lifecycle
	// -------------------------------------------------------------------------

	componentDidCatch(error: Error, info: ErrorInfo): void {
		// Check the error directly rather than reading this.state.isOfflineError,
		// which may not reflect the state written by getDerivedStateFromError yet
		// (the two lifecycle calls are not guaranteed to see the same state).
		if (!isNetworkError(error)) {
			this.props.onError?.(error, info);
		}
	}

	componentDidMount(): void {
		window.addEventListener("online", this.handleOnline);
	}

	componentWillUnmount(): void {
		window.removeEventListener("online", this.handleOnline);
	}

	// -------------------------------------------------------------------------
	// Event handlers
	// -------------------------------------------------------------------------

	private handleOnline = (): void => {
		if (this.state.isOfflineError) {
			// SSR streams cannot resume — a full page reload is the only way to
			// re-fetch the interrupted stream and restore content.
			// No setState needed: the reload discards this component's state anyway.
			window.location.reload();
		}
	};

	// -------------------------------------------------------------------------
	// Render
	// -------------------------------------------------------------------------

	render(): ReactNode {
		const { hasError, isOfflineError, error } = this.state;

		if (isOfflineError) {
			// Network error intercepted — show the offline fallback UI.
			return this.props.fallback;
		}

		if (hasError && error) {
			// Real application error — re-throw so it propagates to the nearest
			// *parent* error boundary (Next.js's error.tsx / global-error.tsx).
			// Throwing from render() is safe here because React error boundaries
			// only catch errors from their *children*, not from themselves.
			throw error;
		}

		return this.props.children;
	}
}
