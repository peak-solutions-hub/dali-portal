import { redirect } from "next/navigation";

export default function Home() {
	// Redirect directly to dashboard - the proxy handles auth check
	// This avoids a double redirect (/ -> /login -> /dashboard)
	redirect("/dashboard");
}
