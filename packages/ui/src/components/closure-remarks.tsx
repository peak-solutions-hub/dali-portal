import { cn } from "@repo/ui/lib/utils";

interface ClosureRemarksProps {
	/** Inquiry status - determines color scheme */
	status: "resolved" | "rejected";
	/** Closure remarks text */
	remarks: string;
	/** Optional additional CSS classes */
	className?: string;
}

/**
 * Displays closure remarks with color-coded styling based on status.
 * - Green for "resolved" inquiries
 * - Red for "rejected" inquiries
 */
export function ClosureRemarks({
	status,
	remarks,
	className,
}: ClosureRemarksProps) {
	const isResolved = status === "resolved";

	return (
		<div
			className={cn(
				"p-4 rounded-lg border-l-4",
				isResolved
					? "bg-green-50 border-green-500"
					: "bg-red-50 border-red-500",
				className,
			)}
		>
			<h4
				className={cn(
					"text-sm font-semibold mb-2",
					isResolved ? "text-green-900" : "text-red-900",
				)}
			>
				Closure Remarks
			</h4>
			<p
				className={cn(
					"text-sm whitespace-pre-wrap",
					isResolved ? "text-green-800" : "text-red-800",
				)}
			>
				{remarks}
			</p>
		</div>
	);
}
