import type { Prisma } from "@/generated/prisma/client";

export type DocumentEntity = Prisma.DocumentGetPayload<object>;

export type DocumentListEntity = Prisma.DocumentGetPayload<{
	include: {
		invitation: {
			select: {
				callerSlipId: true;
			};
			take: 1;
		};
	};
}>;

export type DocumentDetailEntity = Prisma.DocumentGetPayload<{
	include: {
		documentVersion: {
			orderBy: {
				versionNumber: "desc";
			};
		};
		invitation: {
			select: {
				callerSlipId: true;
				vmDecision: true;
				vmDecisionRemarks: true;
				representativeName: true;
			};
			take: 1;
		};
		documentAudit: {
			include: {
				user: {
					select: {
						fullName: true;
					};
				};
			};
			orderBy: {
				createdAt: "desc";
			};
		};
	};
}>;

export interface DocumentListQueryResult {
	items: DocumentListEntity[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export interface DocumentDetailQueryResult {
	document: DocumentDetailEntity;
	signedUrls: Map<string, string>;
}
