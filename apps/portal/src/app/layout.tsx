import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "@repo/ui/globals.css";
import { PublicFooter, PublicHeader } from "@/components/layout/";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
	variable: "--font-playfair-display",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "DALI Portal - Sangguniang Panlungsod ng Iloilo",
	description: "Official portal of the Iloilo City Council",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="h-full">
			<body
				className={`${inter.variable} ${playfairDisplay.variable} antialiased flex flex-col min-h-screen`}
			>
				<PublicHeader />
				<main className="flex-1 pt-18 sm:pt-20">{children}</main>
				<PublicFooter />
				<Toaster position="bottom-right" richColors />
			</body>
		</html>
	);
}
