import type { DocumentTypeEnumType } from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { formatDocumentType } from "@/utils/document-helpers";

interface DocumentTypeIndicatorProps {
	type: DocumentTypeEnumType;
}

export function DocumentTypeIndicator({ type }: DocumentTypeIndicatorProps) {
	return (
		<Badge variant="secondary" className="font-medium">
			{formatDocumentType(type)}
		</Badge>
	);
}
