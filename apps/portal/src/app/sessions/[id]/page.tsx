import { isDefinedError } from "@orpc/client";
import { formatSessionDate, formatSessionTime } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { ChevronLeft } from "@repo/ui/lib/lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SessionDetailSkeleton } from "@/components/sessions/session-detail-skeleton";
import { api } from "@/lib/api.client";
import {
	getSectionLabel,
	getSessionStatusBadgeClass,
	getSessionStatusLabel,
	getSessionTypeBadgeClass,
	getSessionTypeLabel,
} from "@/lib/session-ui";

// Async component that fetches and displays session detail
async function SessionDetailContent({
	id,
	searchParams,
}: {
	id: string;
	searchParams: { [key: string]: string | string[] | undefined };
}) {
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

	// Build back URL preserving view state and filters
	const params = new URLSearchParams();
	Object.entries(searchParams).forEach(([key, value]) => {
		if (value) {
			if (Array.isArray(value)) {
				value.map((v) => params.append(key, v));
			} else {
				params.append(key, value as string);
			}
		}
	});

	// If no params, default to sessions root, otherwise append query string
	const queryString = params.toString();
	const backUrl = queryString ? `/sessions?${queryString}` : "/sessions";

	return (
		<>
			{/* Back Button */}
			<div className="sticky top-0 z-30 bg-gray-50 pt-4 pb-4 ">
				<Link href={backUrl} className="inline-block">
					<Button
						variant="outline"
						size="sm"
						aria-label="Back to Sessions"
						className="cursor-pointer"
					>
						<ChevronLeft className="size-4" />
						Back to Sessions
					</Button>
				</Link>
			</div>
			{/* Main Card */}
			<div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 md:p-8 shadow-sm">
				{/* Session Header */}
				<div className="mb-8 md:mb-12 space-y-4">
					{/* Badges */}
					<div className="flex flex-wrap items-center gap-2 sm:gap-3">
						<Badge
							variant="default"
							className={`font-medium text-white text-xs sm:text-sm ${getSessionTypeBadgeClass(session.type)}`}
							aria-label={`Session type: ${getSessionTypeLabel(session.type)}`}
						>
							{getSessionTypeLabel(session.type)}
						</Badge>
						<Badge
							variant="default"
							className={`font-medium text-white text-xs sm:text-sm ${getSessionStatusBadgeClass(session.status)}`}
							aria-label={`Session status: ${getSessionStatusLabel(session.status)}`}
						>
							{getSessionStatusLabel(session.status)}
						</Badge>
						<span className="text-xs sm:text-sm text-[#4a5565]">
							Session #{session.sessionNumber}
						</span>
					</div>

					{/* Date */}
					<h1 className="font-serif text-2xl sm:text-3xl font-normal text-primary">
						{formatSessionDate(scheduleDate)}
					</h1>

					{/* Time - WCAG AA compliant contrast */}
					<div className="flex items-center gap-2">
						<span className="text-base sm:text-lg font-medium text-gray-900">
							Time:
						</span>
						<time className="text-base sm:text-lg text-gray-900">
							{formatSessionTime(scheduleDate)}
						</time>
					</div>
				</div>

				{/* Session Agenda */}
				<div className="border-t border-gray-200 pt-8">
					<h2 className="mb-6 font-serif text-xl sm:text-2xl text-primary">
						Session Agenda
					</h2>

					{session.agendaItems.length > 0 ? (
						<div className="space-y-6">
							{session.agendaItems.map((item, index) => (
								<div
									key={item.id}
									className="border-l-4 border-primary pl-4 sm:pl-7 py-2"
								>
									<h3 className="text-sm sm:text-base font-semibold text-primary">
										{String(index + 1).padStart(2, "0")}.{" "}
										{getSectionLabel(item.section)}
									</h3>
									{item.contentText && (
										<p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600">
											{item.contentText}
										</p>
									)}
									{item.linkedDocument && (
										<div className="mt-2 sm:mt-3">
											<Link
												href={`/legislative-documents/${item.linkedDocument}`}
												className="text-sm sm:text-base text-primary hover:underline"
											>
												View linked document
											</Link>
										</div>
									)}
									{item.attachmentPath && item.attachmentName && (
										<div className="mt-2 sm:mt-3">
											<span className="text-xs sm:text-sm text-gray-500">
												Attachment: {item.attachmentName}
											</span>
										</div>
									)}
								</div>
							))}
						</div>
					) : (
						<p className="text-sm sm:text-base text-gray-600">
							No agenda items available for this session.
						</p>
					)}
				</div>
			</div>
		</>
	);
}

export default async function SessionDetailPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { id } = await params;
	const urlParams = await searchParams;

	// Validate UUID format before making API call
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(id)) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-[#f9fafb]">
			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-6 sm:py-8">
				<Suspense fallback={<SessionDetailSkeleton />}>
					<SessionDetailContent id={id} searchParams={urlParams} />
				</Suspense>
			</div>
		</div>
	);
}
