import { z } from "zod";

/**
 * Login form validation schema
 */
export const LoginSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(1, "Password is required"),
});

/**
 * Reset password validation schema
 */
export const ResetPasswordSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

/**
 * Strong password requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordRequirements = {
	minLength: 8,
	patterns: {
		uppercase: /[A-Z]/,
		lowercase: /[a-z]/,
		number: /[0-9]/,
		special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
	},
};

/**
 * Set password validation schema (for account activation and password reset)
 */
export const SetPasswordSchema = z
	.object({
		password: z
			.string()
			.min(
				passwordRequirements.minLength,
				`Password must be at least ${passwordRequirements.minLength} characters`,
			)
			.regex(
				passwordRequirements.patterns.uppercase,
				"Password must contain at least one uppercase letter",
			)
			.regex(
				passwordRequirements.patterns.lowercase,
				"Password must contain at least one lowercase letter",
			)
			.regex(
				passwordRequirements.patterns.number,
				"Password must contain at least one number",
			)
			.regex(
				passwordRequirements.patterns.special,
				"Password must contain at least one special character (!@#$%^&*)",
			),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

// Inferred types
export type LoginInput = z.infer<typeof LoginSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type SetPasswordInput = z.infer<typeof SetPasswordSchema>;
