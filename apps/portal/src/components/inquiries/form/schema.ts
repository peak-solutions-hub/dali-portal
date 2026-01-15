import { CreateInquiryTicketSchema } from "@repo/shared";
import { z } from "zod";

export const SubmitInquiryFormSchema = CreateInquiryTicketSchema.extend({
	// Native File objects for upload handling, not sent to API
	files: z.custom<FileList>().optional(),
});

export type SubmitInquiryFormValues = z.infer<typeof SubmitInquiryFormSchema>;
