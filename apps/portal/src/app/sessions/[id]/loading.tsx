import { SessionDetailSkeleton } from "@/components/sessions/session-detail-skeleton";

export default function LoadingSessionDetail() {
	return (
		<div className="min-h-screen bg-gray-50">
			<SessionDetailSkeleton />
		</div>
	);
}
