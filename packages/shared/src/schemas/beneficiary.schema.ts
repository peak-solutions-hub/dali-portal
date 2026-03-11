import { z } from "zod";

export const BeneficiaryVisitSchema = z.object({
	id: z.string(),
	date: z.iso.datetime(),
	title: z.string(),
	assistanceType: z.string(),
	notes: z.string().optional(),
	assistanceDetails: z.record(z.string(), z.string()).optional(),
});

export const BeneficiarySchema = z.object({
	id: z.string(),
	name: z.string(),
	municipality: z.string(),
	barangay: z.string(),
	sex: z.string(),
	civilStatus: z.string(),
	age: z.string(),
	phoneNumber: z.string(),
	email: z.string(),
	purpose: z.string(),
	createdAt: z.iso.datetime(),
	visits: BeneficiaryVisitSchema.array(),
	assistanceDetails: z.record(z.string(), z.record(z.string(), z.string())),
});

export const BeneficiaryListSchema = BeneficiarySchema.array();

export const GetBeneficiaryByIdSchema = z.object({
	id: z.string(),
});

export type BeneficiaryVisitResponse = z.infer<typeof BeneficiaryVisitSchema>;
export type BeneficiaryResponse = z.infer<typeof BeneficiarySchema>;
export type BeneficiaryListResponse = z.infer<typeof BeneficiaryListSchema>;
export type GetBeneficiaryByIdInput = z.infer<typeof GetBeneficiaryByIdSchema>;
