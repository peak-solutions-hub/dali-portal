"use client";

import { Card } from "@repo/ui/components/card";
import { Calendar } from "@repo/ui/lib/lucide-react";
import type { SessionInfoBannerProps } from "@/types/session-management";

export function SessionInfoBanner({ session }: SessionInfoBannerProps) {
	const statusStyles = {
		completed: "bg-green-100 text-green-700",
		scheduled: "bg-blue-100 text-blue-700",
		draft: "bg-gray-100 text-gray-700",
	};

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
							{session.time} • {session.type} session
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<span
						className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusStyles[session.status]}`}
					>
						{session.status}
					</span>
				</div>
			</div>
		</Card>
	);
}
