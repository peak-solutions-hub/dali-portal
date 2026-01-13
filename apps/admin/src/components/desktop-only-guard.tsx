"use client";

import { Card } from "@repo/ui/components/card";
import { Monitor } from "@repo/ui/lib/lucide-react";
import { useEffect, useState } from "react";

const DESKTOP_BREAKPOINT = 1024; // lg breakpoint - agenda builder needs desktop space

/**
 * Desktop-only access guard for admin features
 * Prevents access on mobile and tablet devices
 */
export function DesktopOnlyGuard({ children }: { children: React.ReactNode }) {
	const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

	useEffect(() => {
		const checkDevice = () => {
			setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
		};

		// Initial check
		checkDevice();

		// Listen for resize
		window.addEventListener("resize", checkDevice);
		return () => window.removeEventListener("resize", checkDevice);
	}, []);

	// During SSR or initial load, show nothing to avoid flash
	if (isDesktop === null) {
		return null;
	}

	// Block non-desktop devices
	if (!isDesktop) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
				<Card className="max-w-md p-8 text-center">
					<div className="flex justify-center mb-4">
						<Monitor className="h-16 w-16 text-gray-400" />
					</div>
					<h1 className="text-2xl font-bold text-gray-900 mb-2">
						Desktop Only
					</h1>
					<p className="text-gray-600 mb-4">
						This feature is only accessible on desktop devices due to its
						complexity and screen space requirements.
					</p>
					<p className="text-sm text-gray-500">
						Please access this page from a computer with a screen width of at
						least 1024px.
					</p>
				</Card>
			</div>
		);
	}

	return <>{children}</>;
}
