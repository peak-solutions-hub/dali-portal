import { SessionDetailSkeleton } from "@/components/sessions";

export default function LoadingSessionDetail() {
	return (
		<div className="min-h-screen bg-gray-50">
			<SessionDetailSkeleton />
		</div>
	);
}
