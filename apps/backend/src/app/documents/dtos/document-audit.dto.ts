import type {
	DocumentAuditResponse,
	PurposeType,
	StatusType,
} from "@repo/shared";
import type { Prisma } from "@/generated/prisma/client";

type DocumentAuditEntity = Prisma.DocumentAuditGetPayload<{
	include: {
		user: {
			select: {
				fullName: true;
			};
		};
	};
}>;

const VERSION_RESET_STATUS_RECEIVED_MARKER =
	"SYSTEM:VERSION_UPLOAD_RESET_STATUS_RECEIVED";

export function toDocumentAuditResponses(
	audits: DocumentAuditEntity[],
	currentStatus: StatusType,
	currentPurpose: PurposeType,
): DocumentAuditResponse[] {
	return audits.map((audit, index) => {
		const nextOlderAudit = audits[index + 1];
		const isOldestAudit = index === audits.length - 1;
		const isLatestAudit = index === 0;
		const versionIncreased =
			nextOlderAudit !== undefined &&
			Number(audit.versionNumber) > Number(nextOlderAudit.versionNumber);

		let action = "Document details updated";

		if (isOldestAudit) {
			action = "Document received";
		} else if (versionIncreased) {
			action = `Version ${Number(audit.versionNumber)} uploaded`;

			if (audit.remarks === VERSION_RESET_STATUS_RECEIVED_MARKER) {
				action = `${action}. Status reset to Received`;
			}
		} else if (isLatestAudit) {
			if (currentStatus === "published" && currentPurpose === "for_agenda") {
				action = "Published to archive";
			} else if (currentStatus !== "received") {
				action = `Status changed to ${formatStatusLabel(currentStatus)}`;
			}
		}

		return {
			id: audit.id,
			actorId: audit.actorId,
			actorName: audit.user.fullName,
			documentId: audit.documentId,
			versionNumber: Number(audit.versionNumber),
			filePath: audit.filePath,
			remarks:
				audit.remarks === VERSION_RESET_STATUS_RECEIVED_MARKER
					? null
					: (audit.remarks ?? null),
			action,
			createdAt: audit.createdAt.toISOString(),
		};
	});
}

function formatStatusLabel(status: StatusType): string {
	return status
		.split("_")
		.map((token) => token.charAt(0).toUpperCase() + token.slice(1))
		.join(" ");
}
