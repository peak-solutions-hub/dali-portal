import { z } from "zod";

export const CreateAssistanceRecordSchema = z.object({
	seq: z.string().optional(),
	purpose: z.string().min(1),
	assistanceDate: z.iso.datetime().optional(),
	firstName: z.string().min(1),
	familyName: z.string().min(1),
	streetBarangay: z.string().min(1),
	contactNumber: z.string().min(1),
	laboratoryType: z.string().min(1),
	hospitalName: z.string().min(1),
	medicineName: z.string().min(1),
	givenName: z.string().min(1),
	endorsementDate: z.iso.datetime(),
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
