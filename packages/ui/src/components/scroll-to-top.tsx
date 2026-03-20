"use client";

import { useOnlineStatus } from "@repo/ui/hooks/use-online-status";
import { useScrollToTop } from "@repo/ui/hooks/use-scroll-to-top";
import { ArrowUp } from "lucide-react";

const SCROLL_THRESHOLD = 300;

export function ScrollToTop() {
	const { scrollY, scrollToTop } = useScrollToTop();
	const isOnline = useOnlineStatus();

	if (scrollY < SCROLL_THRESHOLD) return null;

	return (
		<button
			type="button"
			onClick={scrollToTop}
			aria-label="Back to top"
			title="Back to top"
			className={`cursor-pointer fixed right-6 z-50 flex size-11 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition-all hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 active:bg-amber-700 ${isOnline ? "bottom-6" : "bottom-20"}`}
		>
			<ArrowUp className="size-5" aria-hidden="true" />
		</button>
	);
}
