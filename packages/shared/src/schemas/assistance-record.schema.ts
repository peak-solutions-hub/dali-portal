import { z } from "zod";

export const CreateAssistanceRecordSchema = z.object({
	seq: z.string().optional(),
	purpose: z.string().min(1),
	claimantLastName: z.string().min(1),
	claimantGivenName: z.string().min(1),
	claimantMiddleName: z.string().min(1),
	patientLastName: z.string().optional(),
	patientGivenName: z.string().optional(),
	patientMiddleName: z.string().optional(),
	deceasedLastName: z.string().optional(),
	deceasedGivenName: z.string().optional(),
	deceasedMiddleName: z.string().optional(),
	burialDate: z.iso.datetime().optional(),
	street: z.string().min(1),
	subdivisionVillage: z.string().min(1),
	barangay: z.string().min(1),
	cityMunicipality: z.string().min(1),
	province: z.string().min(1),
	zipCode: z.string().min(1),
	contactNumber: z.string().min(1),
});

export const CreateAssistanceRecordResponseSchema = z.object({
	id: z.uuid(),
});

export const CheckDuplicatePersonSchema = z.object({
	purpose: z.string().min(1),
	patientLastName: z.string().optional(),
	patientGivenName: z.string().optional(),
	patientMiddleName: z.string().optional(),
	deceasedLastName: z.string().optional(),
	deceasedGivenName: z.string().optional(),
	deceasedMiddleName: z.string().optional(),
});

export const CheckDuplicatePersonMatchSchema = z.object({
	id: z.uuid(),
	assistanceType: z.string(),
	claimantName: z.string(),
	personName: z.string(),
	matchedAs: z.enum(["patient", "deceased"]),
	createdAt: z.iso.datetime(),
});

export const CheckDuplicatePersonResponseSchema = z.object({
	matches: z.array(CheckDuplicatePersonMatchSchema),
});

export type CreateAssistanceRecordInput = z.infer<
	typeof CreateAssistanceRecordSchema
>;
export type CreateAssistanceRecordResponse = z.infer<
	typeof CreateAssistanceRecordResponseSchema
>;
export type CheckDuplicatePersonInput = z.infer<
	typeof CheckDuplicatePersonSchema
>;
export type CheckDuplicatePersonMatch = z.infer<
	typeof CheckDuplicatePersonMatchSchema
>;
export type CheckDuplicatePersonResponse = z.infer<
	typeof CheckDuplicatePersonResponseSchema
>;
