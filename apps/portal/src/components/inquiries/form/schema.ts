import { CreateInquiryTicketSchema, TEXT_LIMITS } from "@repo/shared";
import { z } from "zod";

export const SubmitInquiryFormSchema = CreateInquiryTicketSchema.extend({
	// Tighter subject limit for the portal form
	subject: z
		.string()
		.min(1, { message: "Subject is required." })
		.max(TEXT_LIMITS.XS, {
			message: `Subject must be ${TEXT_LIMITS.XS} characters or less.`,
		}),
	// Native File objects for upload handling, not sent to API
	files: z.custom<FileList>().optional(),
});

export type SubmitInquiryFormValues = z.infer<typeof SubmitInquiryFormSchema>;
