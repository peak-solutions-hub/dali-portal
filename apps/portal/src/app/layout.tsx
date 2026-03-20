import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "@repo/ui/globals.css";
import { PublicFooter, PublicHeader } from "@/components/layout/";
import {
	BASE_OPEN_GRAPH,
	BASE_TWITTER,
	SITE_AUTHOR,
	SITE_DESCRIPTION,
	SITE_KEYWORDS,
	SITE_TITLE,
	SITE_TITLE_SHORT,
} from "@/lib/seo-metadata";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
	variable: "--font-playfair-display",
	subsets: ["latin"],
});

export const viewport: Viewport = {
	themeColor: "#a60202",
	width: "device-width",
	initialScale: 1,
};

export const metadata: Metadata = {
	metadataBase: new URL(
		process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
	),
	title: {
		default: SITE_TITLE,
		template: `%s | ${SITE_TITLE_SHORT}`,
	},
	description: SITE_DESCRIPTION,
	keywords: [...SITE_KEYWORDS],
	authors: [{ name: SITE_AUTHOR }],
	openGraph: {
		...BASE_OPEN_GRAPH,
		url: "/",
	},
	twitter: BASE_TWITTER,
	robots: {
		index: true,
		follow: true,
	},
	formatDetection: {
		telephone: false,
	},
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
