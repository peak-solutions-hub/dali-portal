import { oc } from "@orpc/contract";
import { ERRORS } from "../constants";
import {
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

export const assistanceRecordContract = {
	create: createAssistanceRecord,
};
