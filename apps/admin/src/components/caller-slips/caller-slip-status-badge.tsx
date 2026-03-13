"use client";

import type { CallerSlipStatus } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";

const STATUS_STYLES: Record<CallerSlipStatus, string> = {
	pending: "bg-amber-100 border-amber-300 text-amber-800",
	completed: "bg-green-100 border-green-300 text-green-800",
};

const STATUS_LABELS: Record<CallerSlipStatus, string> = {
	pending: "Pending",
	completed: "Completed",
};

interface CallerSlipStatusBadgeProps {
	status: CallerSlipStatus;
}

export function CallerSlipStatusBadge({ status }: CallerSlipStatusBadgeProps) {
	return (
		<Badge variant="outline" className={STATUS_STYLES[status] ?? ""}>
			{STATUS_LABELS[status] ?? status}
		</Badge>
	);
}
