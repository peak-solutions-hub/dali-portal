import { oc } from "@orpc/contract";
import { ERRORS } from "../constants";
import {
	CreateScholarshipApplicationResponseSchema,
	CreateScholarshipApplicationSchema,
} from "../schemas/scholarship-application.schema";

export const createScholarshipApplication = oc
	.route({
		method: "POST",
		path: "/scholarship-applications",
		summary: "Create scholarship application",
		description: "Create a scholarship application for a beneficiary.",
		tags: ["Visitor Beneficiary Hub", "Admin"],
	})
	.errors({
		BAD_REQUEST: ERRORS.GENERAL.BAD_REQUEST,
	})
	.input(CreateScholarshipApplicationSchema)
	.output(CreateScholarshipApplicationResponseSchema);

export const scholarshipApplicationContract = {
	create: createScholarshipApplication,
};
