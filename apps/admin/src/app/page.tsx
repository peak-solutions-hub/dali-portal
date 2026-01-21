import { redirect } from "next/navigation";

export default function Home() {
	// Redirect to sign-in as the entry point
	// Authenticated users will be redirected to dashboard by middleware
	redirect("/auth/sign-in");
}
