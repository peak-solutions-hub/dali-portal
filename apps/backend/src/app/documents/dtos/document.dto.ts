import {
	AppError,
	type DocumentDetail,
	type DocumentListItem,
	type DocumentListResponse,
	type DocumentResponse,
	type PurposeType,
	type StatusType,
} from "@repo/shared";
import type {
	DocumentDetailQueryResult,
	DocumentEntity,
	DocumentListEntity,
	DocumentListQueryResult,
} from "../types";
import { toDocumentAuditResponses } from "./document-audit.dto";
import { toDocumentVersionResponse } from "./document-version.dto";

type DocumentResponseEntity = Pick<
	DocumentEntity,
	| "id"
	| "codeNumber"
	| "title"
	| "type"
	| "purpose"
	| "source"
	| "status"
	| "classification"
	| "remarks"
	| "receivedAt"
>;

export function toDocumentResponse(
	document: DocumentResponseEntity,
): DocumentResponse {
	return {
		id: document.id,
		codeNumber: document.codeNumber,
		title: document.title,
		type: document.type,
		purpose: document.purpose,
		source: document.source,
		status: document.status,
		classification: document.classification,
		remarks: document.remarks,
		receivedAt: document.receivedAt.toISOString(),
	};
}

export function toDocumentListItemResponse(
	document: DocumentListEntity,
): DocumentListItem {
	return {
		...toDocumentResponse(document),
		callerSlipId: document.invitation[0]?.callerSlipId ?? null,
	};
}

export function toDocumentListResponse(
	result: DocumentListQueryResult,
): DocumentListResponse {
	return {
		items: result.items.map(toDocumentListItemResponse),
		pagination: result.pagination,
	};
}

export function toDocumentDetailResponse(
	result: DocumentDetailQueryResult,
): DocumentDetail {
	const { document, signedUrls } = result;
	const invitation = document.invitation[0] ?? null;

	return {
		...toDocumentResponse(document),
		versions: document.documentVersion.map((version) => {
			const signedUrl = signedUrls.get(version.filePath);

			if (!signedUrl) {
				throw new AppError("STORAGE.SIGNED_URL_FAILED");
			}

			return toDocumentVersionResponse(version, signedUrl);
		}),
		auditTrail: toDocumentAuditResponses(
			document.documentAudit,
			document.status as StatusType,
			document.purpose as PurposeType,
		),
		invitation: invitation
			? {
					callerSlipId: invitation.callerSlipId,
					vmDecision: invitation.vmDecision,
					vmDecisionRemarks: invitation.vmDecisionRemarks,
					representativeName: invitation.representativeName,
				}
			: null,
	};
}
