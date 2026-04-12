import { AlertCircle, Lock } from "@repo/ui/lib/lucide-react";

interface SessionStatusBannerProps {
	isCompleted: boolean;
	dndError: string | null;
	onDismissDndError: () => void;
}

/**
 * Renders the "completed and locked" banner and the transient DnD error banner.
 * Returns null when neither condition is active.
 */
export function SessionStatusBanner({
	isCompleted,
	dndError,
	onDismissDndError,
}: SessionStatusBannerProps) {
	return (
		<>
			{isCompleted && (
				<div className="flex items-center gap-2 p-3 bg-gray-100 border border-gray-200 rounded-lg">
					<Lock className="h-4 w-4 text-gray-500 shrink-0" aria-hidden="true" />
					<p className="text-sm text-gray-600">
						This session is completed and locked from editing.
					</p>
				</div>
			)}

			{dndError && (
				<div
					className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 animate-in fade-in slide-in-from-top-1 duration-200"
					role="alert"
					aria-live="assertive"
				>
					<AlertCircle
						className="h-4 w-4 mt-0.5 shrink-0 text-red-500"
						aria-hidden="true"
					/>
					<span>{dndError}</span>
					<button
						type="button"
						aria-label="Dismiss drag and drop error"
						onClick={onDismissDndError}
						className="ml-auto shrink-0 cursor-pointer text-red-400 hover:text-red-600 transition-colors focus-visible:ring-2 focus-visible:ring-[#a60202] focus-visible:ring-offset-2"
					>
						✕
					</button>
				</div>
			)}
		</>
	);
}
