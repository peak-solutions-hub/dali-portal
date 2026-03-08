import type { StatusTypeEnumType } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import {
	formatDocumentStatus,
	getDocumentStatusBadgeClass,
} from "@/utils/document-helpers";

interface DocumentStatusBadgeProps {
	status: StatusTypeEnumType;
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
	return (
		<Badge variant="outline" className={getDocumentStatusBadgeClass(status)}>
			{formatDocumentStatus(status).toUpperCase()}
		</Badge>
	);
}
