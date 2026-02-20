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
	return (
		<div
			className={`p-4 rounded-lg border-l-4 ${
				status === "resolved"
					? "bg-green-50 border-green-500"
					: "bg-red-50 border-red-500"
			} ${className || ""}`}
		>
			<h4
				className={`text-sm font-semibold mb-2 ${
					status === "resolved" ? "text-green-900" : "text-red-900"
				}`}
			>
				Closure Remarks
			</h4>
			<p
				className={`text-sm whitespace-pre-wrap ${
					status === "resolved" ? "text-green-800" : "text-red-800"
				}`}
			>
				{remarks}
			</p>
		</div>
	);
}
