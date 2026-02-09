import { Toaster } from "sonner";
import { MainLayout } from "@/components/layout";

export default function ProtectedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<MainLayout>
			{children}
			<Toaster position="bottom-right" richColors />
		</MainLayout>
	);
}
