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
import { createPageMetadata, truncateDescription } from "@/lib/seo-metadata";
import SessionDetailLoading from "./loading";
import { getCachedSessionById, isValidSessionId } from "./session-detail-data";

export const revalidate = 300;

interface PageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { id } = await params;
	if (!isValidSessionId(id)) {
		return { title: "Invalid Session", description: "Invalid session ID." };
	}
	const { error, data: sessionData } = await getCachedSessionById(id);
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
	if (!isValidSessionId(id)) notFound();
	const sessionResult = await getCachedSessionById(id);
	return (
		<div className="min-h-[calc(100svh-4.5rem)] sm:min-h-[calc(100svh-5rem)] bg-[#f9fafb]">
			<ScrollToTop />
			<OnlineStatusBanner />
			<ScrollToTopButton />
			<OfflineAwareSuspense fallback={<SessionDetailLoading />}>
				<SessionDetailContent
					id={id}
					searchParams={urlParams}
					sessionResult={sessionResult}
				/>
			</OfflineAwareSuspense>
		</div>
	);
}
