import {
	CreateInquiryTicketSchema,
	TEXT_LIMITS,
	TrackInquiryTicketSchema,
} from "@repo/shared";
import { z } from "zod";

/**
 * Lenient PH mobile field for on-change UX.
 * Allows valid partials (e.g. "0", "09", "+6") while typing, so the error
 * only appears once the input is clearly wrong or too long.
 * The strict complete-number check lives in the shared contract schema and
 * runs at API validation time.
 */
const lenientPhMobileField = z
	.string()
	.min(1, { message: "Contact number is required." })
	.superRefine((rawVal, ctx) => {
		if (!rawVal) return; // min(1) handles the empty case above
		const val = rawVal.replace(/[\s-]/g, "");
		if (!val) return;

		// Valid partial builds toward 09XXXXXXXXX (max 11 chars) or
		// +639XXXXXXXXX (max 13 chars) — stay silent while still typing
		const isValidPartial = /^0\d{0,10}$/.test(val) || /^\+\d{0,12}$/.test(val);
		if (isValidPartial) return;

		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message:
				"Enter a valid Philippine mobile number (e.g. 09XXXXXXXXX or +639XXXXXXXXX).",
		});
	});

export const SubmitInquiryFormSchema = CreateInquiryTicketSchema.extend({
	// Tighter subject limit for the portal form
	subject: z
		.string()
		.min(1, { message: "Subject is required." })
		.max(TEXT_LIMITS.XS, {
			message: `Subject must be ${TEXT_LIMITS.XS} characters or less.`,
		}),
	// Lenient on-change UX — strict validation happens at API level
	citizenContactNumber: lenientPhMobileField,
	// Native File objects for upload handling, not sent to API
	files: z.custom<FileList>().optional(),
});

export type SubmitInquiryFormValues = z.infer<typeof SubmitInquiryFormSchema>;

/** UI-only schema for the track form — same leniency as above */
export const TrackInquiryFormSchema = TrackInquiryTicketSchema.extend({
	citizenContactNumber: lenientPhMobileField,
});

export type TrackInquiryFormValues = z.infer<typeof TrackInquiryFormSchema>;
