import { SessionDetailSkeleton } from "@/components/sessions/session-detail-skeleton";

export default function LoadingSessionDetail() {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-6 sm:py-8">
				<SessionDetailSkeleton />
			</div>
		</div>
	);
}
