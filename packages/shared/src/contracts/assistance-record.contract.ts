import { oc } from "@orpc/contract";
import { ERRORS } from "../constants";
import {
	CheckDuplicatePersonResponseSchema,
	CheckDuplicatePersonSchema,
	CreateAssistanceRecordResponseSchema,
	CreateAssistanceRecordSchema,
} from "../schemas/assistance-record.schema";

export const createAssistanceRecord = oc
	.route({
		method: "POST",
		path: "/assistance-records",
		summary: "Create assistance record",
		description: "Create a new assistance record for a beneficiary.",
		tags: ["Visitor Beneficiary Hub", "Admin"],
	})
	.errors({
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
	})
	.input(CreateAssistanceRecordSchema)
	.output(CreateAssistanceRecordResponseSchema);

export const checkDuplicatePersonAssistanceRecord = oc
	.route({
		method: "POST",
		path: "/assistance-records/check-duplicate-person",
		summary: "Check duplicate patient/deceased",
		description:
			"Check if a patient/deceased name already exists in assistance records.",
		tags: ["Visitor Beneficiary Hub", "Admin"],
	})
	.errors({
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
	})
	.input(CheckDuplicatePersonSchema)
	.output(CheckDuplicatePersonResponseSchema);

export const assistanceRecordContract = {
	create: createAssistanceRecord,
	checkDuplicatePerson: checkDuplicatePersonAssistanceRecord,
};
