"use client";

import { Card } from "@repo/ui/components/card";
import { Calendar } from "@repo/ui/lib/lucide-react";
import {
	getSessionStatusBadgeClass,
	getSessionStatusLabel,
	getSessionTypeLabel,
} from "@repo/ui/lib/session-ui";
import type { SessionInfoBannerProps } from "@/types/session-management";

export function SessionInfoBanner({ session }: SessionInfoBannerProps) {
	const statusClass = getSessionStatusBadgeClass(session.status);
	const statusLabel = getSessionStatusLabel(session.status);

	return (
		<Card className="p-4 mb-6 bg-blue-50 border-blue-200">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<div className="p-2 bg-blue-100 rounded-lg">
						<Calendar className="h-5 w-5 text-blue-600" />
					</div>
					<div>
						<h3 className="font-semibold text-gray-900">
							{new Date(session.date).toLocaleDateString("en-US", {
								weekday: "long",
								month: "long",
								day: "numeric",
								year: "numeric",
							})}
						</h3>
						<p className="text-sm text-gray-600">
							{session.time} • {getSessionTypeLabel(session.type)}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<span
						className={`px-3 py-1 rounded-full text-sm font-medium ${statusClass} text-white`}
						aria-label={`Session status: ${statusLabel}`}
					>
						{statusLabel}
					</span>
				</div>
			</div>
		</Card>
	);
}
