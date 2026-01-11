import { isDefinedError } from "@orpc/client";
import {
	formatSessionDate,
	formatSessionTime,
	type SessionWithAgenda,
} from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { ChevronLeft } from "@repo/ui/lib/lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api.client";
import {
	getSectionLabel,
	getSessionStatusBadgeClass,
	getSessionStatusLabel,
	getSessionTypeBadgeClass,
	getSessionTypeLabel,
} from "@/lib/session-ui";

export default async function SessionDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	// Validate UUID format before making API call
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(id)) {
		notFound();
	}

	// Fetch session from API
	const [error, session] = await api.sessions.getById({ id });

	// Handle errors - use generic error to prevent enumeration
	if (error) {
		if (isDefinedError(error) && error.code === "NOT_FOUND") {
			notFound();
		}
		// For other errors, also return not found to prevent enumeration
		notFound();
	}

	if (!session) {
		notFound();
	}

	// Ensure scheduleDate is a Date object
	const scheduleDate = new Date(session.scheduleDate);

	return (
		<div className="min-h-screen bg-[#f9fafb]">
			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-6 sm:py-8">
				{/* Back Button */}
				<Link href="/sessions" className="mb-8 inline-block">
					<Button
						variant="outline"
						size="sm"
						aria-label="Back to Sessions list"
						className="cursor-pointer"
					>
						<ChevronLeft className="size-4" />
						Back to Sessions
					</Button>
				</Link>

				{/* Main Card */}
				<div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
					{/* Session Header */}
					<div className="mb-12 space-y-4">
						{/* Badges */}
						<div className="flex gap-3">
							<Badge
								variant="default"
								className={`font-medium text-white ${getSessionTypeBadgeClass(session.type)}`}
								aria-label={`Session type: ${getSessionTypeLabel(session.type)}`}
							>
								{getSessionTypeLabel(session.type)}
							</Badge>
							<Badge
								variant="default"
								className={`font-medium text-white ${getSessionStatusBadgeClass(session.status)}`}
								aria-label={`Session status: ${getSessionStatusLabel(session.status)}`}
							>
								{getSessionStatusLabel(session.status)}
							</Badge>
							<span className="text-sm text-[#4a5565]">
								Session #{session.sessionNumber}
							</span>
						</div>

						{/* Date */}
						<h1 className="font-serif text-3xl font-normal text-primary">
							{formatSessionDate(scheduleDate)}
						</h1>

						{/* Time - WCAG AA compliant contrast */}
						<div className="flex items-center gap-2">
							<span className="text-lg font-medium text-gray-900">Time:</span>
							<time className="text-lg text-gray-900">
								{formatSessionTime(scheduleDate)}
							</time>
						</div>
					</div>

					{/* Session Agenda */}
					<div className="border-t border-gray-200 pt-8">
						<h2 className="mb-6 font-serif text-2xl text-primary">
							Session Agenda
						</h2>

						{session.agendaItems.length > 0 ? (
							<div className="space-y-6">
								{session.agendaItems.map((item, index) => (
									<div
										key={item.id}
										className="border-l-4 border-primary pl-7 py-2"
									>
										<h3 className="text-base font-semibold text-primary">
											{String(index + 1).padStart(2, "0")}.{" "}
											{getSectionLabel(item.section)}
										</h3>
										{item.contentText && (
											<p className="mt-3 text-base text-gray-600">
												{item.contentText}
											</p>
										)}
										{item.linkedDocument && (
											<div className="mt-3">
												<Link
													href={`/legislative-documents/${item.linkedDocument}`}
													className="text-base text-primary hover:underline"
												>
													View linked document
												</Link>
											</div>
										)}
										{item.attachmentPath && item.attachmentName && (
											<div className="mt-3">
												<span className="text-sm text-gray-500">
													Attachment: {item.attachmentName}
												</span>
											</div>
										)}
									</div>
								))}
							</div>
						) : (
							<p className="text-base text-gray-600">
								No agenda items available for this session.
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
