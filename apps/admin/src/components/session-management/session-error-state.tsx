"use client";

import { Button } from "@repo/ui/components/button";
import { isNetworkError } from "@repo/ui/lib/is-network-error";
import { AlertCircle, RefreshCw, WifiOff } from "@repo/ui/lib/lucide-react";

type ErrorVariant = "sessions" | "session" | "documents";

interface SessionErrorStateProps {
	/** Which data source failed */
	variant: ErrorVariant;
	/** Explicit network classification (used when only message strings are available) */
	isNetwork?: boolean;
	/** Optional source error object for robust network detection */
	error?: unknown;
	/** Custom error message — overrides the default description */
	message?: string;
	/** Retry handler */
	onRetry: () => void;
}

const ERROR_CONFIG: Record<
	ErrorVariant,
	{ title: string; description: string }
> = {
	sessions: {
		title: "Unable to load sessions",
		description:
			"We couldn't retrieve the sessions needed for this page. Please try again.",
	},
	session: {
		title: "Unable to load selected session",
		description:
			"We couldn't load the session details. Please check your connection and try again.",
	},
	documents: {
		title: "Unable to load calendared documents",
		description:
			"The calendared documents list couldn't be loaded. You can still browse sessions, but document assignment won't be available.",
	},
};

const NETWORK_VISUAL = {
	container: "border-blue-200 bg-blue-50",
	iconWrap: "bg-blue-100",
	icon: "text-blue-700",
	badge: "bg-blue-100 text-blue-800",
	button: "border-blue-300 text-blue-800 hover:bg-blue-100",
	label: "Network Issue",
};

const GENERIC_VISUAL = {
	container: "border-red-200 bg-red-50",
	iconWrap: "bg-red-100",
	icon: "text-red-700",
	badge: "bg-red-100 text-red-800",
	button: "border-red-300 text-red-800 hover:bg-red-100",
	label: "Service Issue",
};

/**
 * Error state displayed when session management API calls fail.
 * Supports different variants for sessions, a single session, or documents.
 */
export function SessionErrorState({
	variant,
	isNetwork,
	error,
	message,
	onRetry,
}: SessionErrorStateProps) {
	const config = ERROR_CONFIG[variant];
	const isNetworkLike =
		isNetwork ?? (error instanceof Error && isNetworkError(error));
	const Icon = isNetworkLike ? WifiOff : AlertCircle;
	const visual = isNetworkLike ? NETWORK_VISUAL : GENERIC_VISUAL;
	const description = message ?? config.description;

	// Documents variant stays panel-scoped but should still be prominent.
	if (variant === "documents") {
		return (
			<div
				className={`rounded-xl border px-4 py-3 ${visual.container}`}
				role="alert"
				aria-live="polite"
			>
				<div className="mb-3 flex items-start gap-3">
					<span
						className={`mt-0.5 rounded-full p-2 ${visual.iconWrap}`}
						aria-hidden="true"
					>
						<Icon className={`h-4 w-4 ${visual.icon}`} aria-hidden="true" />
					</span>
					<div className="min-w-0 flex-1">
						<div className="mb-1 flex flex-wrap items-center gap-2">
							<p className="text-sm font-semibold text-gray-900">
								{config.title}
							</p>
							<span
								className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${visual.badge}`}
							>
								{visual.label}
							</span>
						</div>
						<p className="text-xs leading-relaxed text-gray-700">
							{description}
						</p>
					</div>
				</div>

				<div className="flex items-center justify-center border-t border-gray-200/70 pt-3">
					<Button
						variant="outline"
						size="sm"
						className={`cursor-pointer text-xs ${visual.button}`}
						onClick={onRetry}
					>
						<RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
						Retry
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full min-h-90 items-center justify-center">
			<div
				className={`w-full max-w-2xl rounded-xl border p-6 shadow-sm ${visual.container}`}
				role="alert"
				aria-live="polite"
			>
				<div className="mb-4 flex items-start gap-3">
					<span
						className={`mt-0.5 rounded-full p-2.5 ${visual.iconWrap}`}
						aria-hidden="true"
					>
						<Icon className={`h-5 w-5 ${visual.icon}`} aria-hidden="true" />
					</span>
					<div className="min-w-0">
						<div className="mb-1 flex flex-wrap items-center gap-2">
							<h3 className="text-base font-semibold text-gray-900">
								{config.title}
							</h3>
							<span
								className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${visual.badge}`}
							>
								{visual.label}
							</span>
						</div>
						<p className="text-sm leading-relaxed text-gray-700">
							{description}
						</p>
					</div>
				</div>

				<div className="flex items-center justify-center border-t border-gray-200/70 pt-4">
					<Button
						variant="outline"
						size="sm"
						className={`cursor-pointer ${visual.button}`}
						onClick={onRetry}
					>
						<RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
						Try Again
					</Button>
				</div>
			</div>
		</div>
	);
}
