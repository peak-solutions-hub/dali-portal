import { Toaster } from "sonner";

/**
 * Auth layout wrapper
 *
 * Note: Session-based redirects are handled by individual pages or middleware.
 * - sign-in, forgot-password: Should redirect authenticated users to dashboard
 * - set-password, confirm: Should be accessible even when authenticated
 *   (needed for invite acceptance and password reset flows)
 */
export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			{children}
			<Toaster position="top-center" richColors />
		</>
	);
}
