import { z } from "zod";

export const VisitorLogSchema = z.object({
	id: z.string().min(1),
	dateVisited: z.iso.datetime(),
	constituentName: z.string(),
	purposeAffiliation: z.string(),
	loggedBy: z.string(),
});

export const VisitorLogListSchema = VisitorLogSchema.array();

export const CreateVisitorLogSchema = z.object({
	familyName: z.string().min(1),
	firstName: z.string().min(1),
	middleInitial: z.string().max(10).optional(),
	contactNumber: z.string().min(1),
	barangay: z.string().min(1),
	cityMunicipality: z.string().min(1),
	province: z.string().min(1),
	reasonForVisitAffiliation: z.string().min(1),
});

export const CreateVisitorLogResponseSchema = z.object({
	id: z.uuid(),
});

export type VisitorLogResponse = z.infer<typeof VisitorLogSchema>;
export type VisitorLogListResponse = z.infer<typeof VisitorLogListSchema>;
export type CreateVisitorLogInput = z.infer<typeof CreateVisitorLogSchema>;
export type CreateVisitorLogResponse = z.infer<
	typeof CreateVisitorLogResponseSchema
>;
