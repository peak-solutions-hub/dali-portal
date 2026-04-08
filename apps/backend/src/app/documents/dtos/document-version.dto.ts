import type { DocumentDetail } from "@repo/shared";
import type { Prisma } from "@/generated/prisma/client";

type DocumentVersionEntity = Prisma.DocumentVersionGetPayload<object>;

export function toDocumentVersionResponse(
	version: DocumentVersionEntity,
	signedUrl: string,
): DocumentDetail["versions"][number] {
	return {
		id: version.id,
		documentId: version.documentId,
		uploaderId: version.uploaderId,
		versionNumber: Number(version.versionNumber),
		filePath: version.filePath,
		signedUrl,
		createdAt: version.createdAt.toISOString(),
	};
}
