import type { InquiryStatus } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui/lib/utils";
import { formatInquiryStatus } from "@/utils/inquiry-helpers";

interface InquiryStatusBadgeProps {
	status: InquiryStatus;
	className?: string;
}

export function InquiryStatusBadge({
	status,
	className,
}: InquiryStatusBadgeProps) {
	const getStatusConfig = (status: InquiryStatus) => {
		switch (status) {
			case "new":
				return {
					className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
				};
			case "open":
				return {
					className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
				};
			case "waiting_for_citizen":
				return {
					className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
				};
			case "resolved":
				return {
					className: "bg-green-100 text-green-800 hover:bg-green-100",
				};
			case "rejected":
				return {
					className: "bg-red-100 text-red-800 hover:bg-red-100",
				};
			default:
				return {
					className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
				};
		}
	};

	const config = getStatusConfig(status);

	return (
		<Badge className={cn("text-xs font-medium", config.className, className)}>
			{formatInquiryStatus(status)}
		</Badge>
	);
}
