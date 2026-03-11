import { oc } from "@orpc/contract";
import { ERRORS } from "../constants";
import {
	BeneficiaryListSchema,
	BeneficiarySchema,
	GetBeneficiaryByIdSchema,
} from "../schemas/beneficiary.schema";

export const listBeneficiaries = oc
	.route({
		method: "GET",
		path: "/beneficiaries",
		summary: "List beneficiaries",
		description: "List beneficiaries with profile and visit details.",
		tags: ["Visitor Beneficiary Hub", "Admin"],
	})
	.errors({
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
	})
	.output(BeneficiaryListSchema);

export const getBeneficiaryById = oc
	.route({
		method: "GET",
		path: "/beneficiaries/{id}",
		summary: "Get beneficiary by ID",
		description: "Get a single beneficiary profile.",
		tags: ["Visitor Beneficiary Hub", "Admin"],
	})
	.errors({
		NOT_FOUND: ERRORS.GENERAL.NOT_FOUND,
	})
	.input(GetBeneficiaryByIdSchema)
	.output(BeneficiarySchema);

export const beneficiaryContract = {
	list: listBeneficiaries,
	getById: getBeneficiaryById,
};
