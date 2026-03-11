import { z } from "zod";

export const VisitorLogSchema = z.object({
	id: z.uuid(),
	dateVisited: z.iso.datetime(),
	constituentName: z.string(),
	purpose: z.string(),
	affiliation: z.string().nullable(),
	remarks: z.string().nullable(),
	loggedBy: z.string(),
});

export const VisitorLogListSchema = VisitorLogSchema.array();

export const CreateVisitorLogSchema = z.object({
	familyName: z.string().min(1),
	firstName: z.string().min(1),
	affiliation: z.string().optional(),
	purpose: z.string().min(1),
	remarks: z.string().optional(),
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
