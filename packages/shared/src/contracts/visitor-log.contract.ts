import { oc } from "@orpc/contract";
import { ERRORS } from "../constants";
import {
	CreateVisitorLogResponseSchema,
	CreateVisitorLogSchema,
	VisitorLogListSchema,
} from "../schemas/visitor-log.schema";

export const createVisitorLog = oc
	.route({
		method: "POST",
		path: "/visitor-logs",
		summary: "Create visitor log",
		description: "Create a new visitor log entry.",
		tags: ["Visitor Beneficiary Hub", "Admin"],
	})
	.errors({
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
	})
	.input(CreateVisitorLogSchema)
	.output(CreateVisitorLogResponseSchema);

export const listVisitorLogs = oc
	.route({
		method: "GET",
		path: "/visitor-logs",
		summary: "List visitor logs",
		description: "List visitor log entries.",
		tags: ["Visitor Beneficiary Hub", "Admin"],
	})
	.errors({
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
	})
	.output(VisitorLogListSchema);

export const visitorLogContract = {
	create: createVisitorLog,
	list: listVisitorLogs,
};
