import {
	formatSessionDate,
	formatSessionTime,
	transformSessionWithAgendaDates,
} from "@repo/shared";
import { OfflineAwareSuspense } from "@repo/ui/components/offline-aware-suspense";
import { OnlineStatusBanner } from "@repo/ui/components/online-status-banner";
import { ScrollToTop as ScrollToTopButton } from "@repo/ui/components/scroll-to-top";
import {
	getSessionStatusLabel,
	getSessionTypeLabel,
} from "@repo/ui/lib/session-ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SessionDetailContent } from "@/components/sessions";
import { api } from "@/lib/api.client";
import { createPageMetadata, truncateDescription } from "@/lib/seo-metadata";
import SesisonDetailLoading from "./loading";

interface PageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { id } = await params;
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(id)) {
		return { title: "Invalid Session", description: "Invalid session ID." };
	}
	const [error, sessionData] = await api.sessions.getById({ id });
	if (error || !sessionData) {
		return {
			title: "Session Not Found",
			description: "The requested council session could not be found.",
		};
	}
	const session = transformSessionWithAgendaDates(sessionData);
	const scheduleDate = new Date(session.scheduleDate);
	const formattedDate = formatSessionDate(scheduleDate);
	const formattedTime = formatSessionTime(scheduleDate);
	const sessionType = getSessionTypeLabel(session.type);
	const sessionStatus = getSessionStatusLabel(session.status);
	const agendaCount = session.agendaItems?.length || 0;
	const title = `Session #${session.sessionNumber} - ${formattedDate}`;
	const description = `${sessionType} on ${formattedDate} at ${formattedTime}. ${agendaCount} agenda ${agendaCount === 1 ? "item" : "items"}. Status: ${sessionStatus}.`;

	// leverage helper for consistency and type safety
	return createPageMetadata({
		title,
		description: truncateDescription(description),
		url: `/sessions/${id}`,
		imagePath: `/sessions/${id}/opengraph-image`,
		ogType: "article",
		ogExtra: {
			description,
			publishedTime: scheduleDate.toISOString(),
		},
	});
}

export default async function SessionDetailPage({
	params,
	searchParams,
}: PageProps) {
	const { id } = await params;
	const urlParams = await searchParams;
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(id)) notFound();
	return (
		<div className="min-h-screen bg-[#f9fafb]">
			<ScrollToTop />
			<OnlineStatusBanner />
			<ScrollToTopButton />
			<OfflineAwareSuspense fallback={<SesisonDetailLoading />}>
				<SessionDetailContent id={id} searchParams={urlParams} />
			</OfflineAwareSuspense>
		</div>
	);
}
