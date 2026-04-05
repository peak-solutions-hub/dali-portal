import { oc } from "@orpc/contract";
import { ERRORS } from "../constants";
import {
	CallerSlipDetailSchema,
	CallerSlipListResponseSchema,
	CompleteCallerSlipResponseSchema,
	CompleteCallerSlipSchema,
	GenerateCallerSlipResponseSchema,
	GenerateCallerSlipSchema,
	GetCallerSlipByIdSchema,
	GetCallerSlipListSchema,
	RecordDecisionResponseSchema,
	RecordDecisionSchema,
} from "../schemas/caller-slip.schema";

export const getCallerSlipList = oc
	.route({
		method: "GET",
		path: "/admin/caller-slips",
		summary: "Get caller slip list",
		description:
			"Admin endpoint to list caller slips with filtering, searching, and pagination.",
		tags: ["Caller Slips", "Admin"],
	})
	.errors({
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		FORBIDDEN: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(GetCallerSlipListSchema)
	.output(CallerSlipListResponseSchema);

export const getCallerSlipById = oc
	.route({
		method: "GET",
		path: "/admin/caller-slips/{id}",
		summary: "Get caller slip details",
		description:
			"Admin endpoint to retrieve a caller slip with its invitations and document details.",
		tags: ["Caller Slips", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.CALLER_SLIP.NOT_FOUND,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		FORBIDDEN: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(GetCallerSlipByIdSchema)
	.output(CallerSlipDetailSchema);

export const generateCallerSlip = oc
	.route({
		method: "POST",
		path: "/admin/caller-slips",
		summary: "Generate a caller slip",
		description:
			"Admin endpoint to create a caller slip by batching selected invitation documents.",
		tags: ["Caller Slips", "Admin"],
	})
	.errors({
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
		EMPTY_BATCH: ERRORS.CALLER_SLIP.EMPTY_BATCH,
		INVITATION_NOT_INVITATION_TYPE:
			ERRORS.CALLER_SLIP.INVITATION_NOT_INVITATION_TYPE,
		INVITATION_ALREADY_ASSIGNED: ERRORS.CALLER_SLIP.INVITATION_ALREADY_ASSIGNED,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		FORBIDDEN: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(GenerateCallerSlipSchema)
	.output(GenerateCallerSlipResponseSchema);

export const recordDecision = oc
	.route({
		method: "PATCH",
		path: "/admin/caller-slips/{slipId}/invitations/{invitationId}/decision",
		summary: "Record VM decision on an invitation",
		description:
			"Admin endpoint to record the Vice Mayor's decision (attend, decline, or assign representative) for an invitation in a caller slip.",
		tags: ["Caller Slips", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.CALLER_SLIP.NOT_FOUND,
		ALREADY_COMPLETED: ERRORS.CALLER_SLIP.ALREADY_COMPLETED,
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		FORBIDDEN: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(RecordDecisionSchema)
	.output(RecordDecisionResponseSchema);

export const completeCallerSlip = oc
	.route({
		method: "PATCH",
		path: "/admin/caller-slips/{id}/complete",
		summary: "Mark a caller slip as completed",
		description:
			"Admin endpoint to mark a caller slip as completed after all decisions have been recorded.",
		tags: ["Caller Slips", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.CALLER_SLIP.NOT_FOUND,
		ALREADY_COMPLETED: ERRORS.CALLER_SLIP.ALREADY_COMPLETED,
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		FORBIDDEN: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	})
	.input(CompleteCallerSlipSchema)
	.output(CompleteCallerSlipResponseSchema);

export const callerSlipContract = {
	getList: getCallerSlipList,
	getById: getCallerSlipById,
	generate: generateCallerSlip,
	recordDecision,
	complete: completeCallerSlip,
};
