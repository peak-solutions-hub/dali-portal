import { SessionDetailSkeleton } from "@/components/sessions/session-detail-skeleton";

export default function LoadingSessionDetail() {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-6 py-8 max-w-7xl">
				<SessionDetailSkeleton />
			</div>
		</div>
	);
}
