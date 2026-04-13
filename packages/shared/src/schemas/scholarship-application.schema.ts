import { z } from "zod";

export const CreateScholarshipApplicationSchema = z.object({
	seq: z.string().min(1),
	studentId: z.string().min(1),
	lastName: z.string().min(1),
	givenName: z.string().min(1),
	extName: z.string().optional(),
	scholarshipMiddleName: z.string().min(1),
	scholarshipSex: z.enum(["male", "female", "prefer_not_to_say"]),
	scholarshipBirthdate: z.iso.datetime(),
	completeProgramName: z.string().min(1),
	yearLevel: z.string().min(1),
	street: z.string().min(1),
	subdivisionVillage: z.string().min(1),
	barangay: z.string().min(1),
	cityMunicipality: z.string().min(1),
	province: z.string().min(1),
	zipCode: z.string().min(1),
	contactNumber: z.string().min(1),
	emailAddress: z
		.email({ message: "Enter a valid email address." })
		.optional()
		.or(z.literal("")),
	heiUii: z.string().min(1),
	heiName: z.string().min(1),
	fatherLastName: z.string().min(1),
	fatherGivenName: z.string().min(1),
	fatherMiddleName: z.string().min(1),
	motherMaidenLastName: z.string().min(1),
	motherGivenName: z.string().min(1),
	motherMaidenMiddleName: z.string().min(1),
	guardianName: z.string().optional(),
	guardianContactNo: z.string().min(1),
	guardianEmailAddress: z
		.email({ message: "Enter a valid email address." })
		.optional()
		.or(z.literal("")),
});

export const CreateScholarshipApplicationResponseSchema = z.object({
	id: z.string(),
});

export type CreateScholarshipApplicationInput = z.infer<
	typeof CreateScholarshipApplicationSchema
>;
export type CreateScholarshipApplicationResponse = z.infer<
	typeof CreateScholarshipApplicationResponseSchema
>;
