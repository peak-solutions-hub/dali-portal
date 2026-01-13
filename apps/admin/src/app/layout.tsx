import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@repo/ui/globals.css";
import { LayoutContent } from "@/components/layout/layout-content";
import { Sidebar } from "@/components/layout/sidebar";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "DALI Portal - Internal Management System",
	description: "Iloilo City Vice Mayor's Office Internal Management System",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<div className="flex h-screen overflow-hidden bg-[#f9fafb]">
					<Sidebar />
					<div className="flex-1 flex flex-col overflow-hidden">
						<LayoutContent>{children}</LayoutContent>
					</div>
				</div>
			</body>
		</html>
	);
}
