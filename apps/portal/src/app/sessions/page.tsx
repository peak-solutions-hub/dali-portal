import {
	buildSessionQueryString,
	validateSessionSearchParams,
} from "@repo/shared";
import { OfflineAwareSuspense } from "@repo/ui/components/offline-aware-suspense";
import { OnlineStatusBanner } from "@repo/ui/components/online-status-banner";
import { ScrollToTop as ScrollToTopButton } from "@repo/ui/components/scroll-to-top";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SessionContent } from "@/components/sessions";
import {
	BASE_OPEN_GRAPH,
	BASE_TWITTER,
	createOgImageMeta,
} from "@/lib/seo-metadata";
import SessionLoading from "./loading";

export const metadata: Metadata = {
	title: "Council Sessions — Iloilo City",
	description:
		"Browse Iloilo City Council sessions. Regular sessions are held every Wednesday at 10:00 AM. View schedules, agendas, and session details.",
	openGraph: {
		...BASE_OPEN_GRAPH,
		title: "Council Sessions — Iloilo City",
		description:
			"Browse Iloilo City Council sessions with schedules, agendas, and detailed information about regular and special sessions.",
		type: "website",
		url: "/sessions",
		images: createOgImageMeta(
			"/sessions/opengraph-image",
			"Council Sessions — Iloilo City",
		),
	},
	twitter: {
		...BASE_TWITTER,
		title: "Council Sessions — Iloilo City",
		description:
			"Browse Iloilo City Council sessions. Regular sessions held every Wednesday at 10:00 AM.",
		images: ["/sessions/opengraph-image"],
	},
};

export default async function Sessions({
	searchParams,
}: {
	searchParams: Promise<{
		page?: string;
		view?: string;
		month?: string;
		year?: string;
		sort?: string;
		types?: string;
		statuses?: string;
		dateFrom?: string;
		dateTo?: string;
	}>;
}) {
	const params = await searchParams;

	// Validate search parameters with Zod
	const validationResult = validateSessionSearchParams(params);

	// If validation fails, redirect to valid default params
	if (!validationResult.success) {
		const queryString = buildSessionQueryString({
			view: "list",
			page: "1",
			sort: "desc",
		});
		redirect(`/sessions?${queryString}`);
	}

	const validatedParams = validationResult.data;
	const view = validatedParams.view;

	return (
		<>
			<ScrollToTop />
			<OnlineStatusBanner />
			<ScrollToTopButton />
			<OfflineAwareSuspense fallback={<SessionLoading view={view} />}>
				<SessionContent params={validatedParams} />
			</OfflineAwareSuspense>
		</>
	);
}
