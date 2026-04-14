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

export type CreateAssistanceRecordInput = z.infer<
	typeof CreateAssistanceRecordSchema
>;
export type CreateAssistanceRecordResponse = z.infer<
	typeof CreateAssistanceRecordResponseSchema
>;
