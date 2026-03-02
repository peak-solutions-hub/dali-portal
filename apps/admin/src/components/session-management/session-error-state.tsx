"use client";

import { Button } from "@repo/ui/components/button";
import { AlertCircle, RefreshCw, WifiOff } from "@repo/ui/lib/lucide-react";

type ErrorVariant = "sessions" | "session" | "documents";

interface SessionErrorStateProps {
	/** Which data source failed */
	variant: ErrorVariant;
	/** Custom error message — overrides the default description */
	message?: string;
	/** Retry handler — if omitted, uses window.location.reload() */
	onRetry?: () => void;
}

const ERROR_CONFIG: Record<
	ErrorVariant,
	{ title: string; description: string; icon: typeof AlertCircle }
> = {
	sessions: {
		title: "Unable to load sessions",
		description:
			"We couldn't retrieve the session list. This may be due to a connection issue or a temporary server problem.",
		icon: WifiOff,
	},
	session: {
		title: "Unable to load session",
		description:
			"We couldn't load the session details. Please check your connection and try again.",
		icon: AlertCircle,
	},
	documents: {
		title: "Unable to load documents",
		description:
			"The approved documents list couldn't be loaded. You can still browse sessions, but document assignment won't be available.",
		icon: AlertCircle,
	},
};

/**
 * Error state displayed when session management API calls fail.
 * Supports different variants for sessions, a single session, or documents.
 */
export function SessionErrorState({
	variant,
	message,
	onRetry,
}: SessionErrorStateProps) {
	const config = ERROR_CONFIG[variant];
	const Icon = config.icon;
	const description = message ?? config.description;

	const handleRetry = () => {
		if (onRetry) {
			onRetry();
		} else {
			window.location.reload();
		}
	};

	// For the "documents" variant, show a compact inline banner instead of full-page
	if (variant === "documents") {
		return (
			<div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
				<Icon className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
				<div className="flex-1 min-w-0">
					<p className="font-medium text-xs">{config.title}</p>
					<p className="text-[11px] text-amber-700 mt-0.5 leading-snug">
						{description}
					</p>
				</div>
				<Button
					variant="ghost"
					size="sm"
					className="cursor-pointer shrink-0 h-7 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-100"
					onClick={handleRetry}
				>
					<RefreshCw className="h-3 w-3 mr-1" />
					Retry
				</Button>
			</div>
		);
	}

	// Centered error content (shared by "sessions" and "session" variants)
	const errorContent = (
		<div className="flex-1 flex items-center justify-center">
			<div className="flex flex-col items-center text-center max-w-sm">
				<div className="rounded-full bg-red-50 p-3 mb-3">
					<Icon className="h-6 w-6 text-red-500" />
				</div>
				<h3 className="text-sm font-semibold text-gray-900 mb-1">
					{config.title}
				</h3>
				<p className="text-xs text-gray-500 leading-relaxed mb-4">
					{description}
				</p>
				<Button
					variant="outline"
					size="sm"
					className="cursor-pointer text-xs"
					onClick={handleRetry}
				>
					<RefreshCw className="h-3.5 w-3.5 mr-1.5" />
					Try Again
				</Button>
			</div>
		</div>
	);

	// "sessions" variant: wraps in full 2-column layout container (replaces page layout)
	if (variant === "sessions") {
		return (
			<div className="flex gap-4 flex-1 overflow-hidden">{errorContent}</div>
		);
	}

	// "session" variant: renders inline (used inside agenda panel)
	return errorContent;
}
