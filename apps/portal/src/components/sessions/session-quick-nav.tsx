"use client";

import { List } from "@repo/ui/lib/lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface SectionLink {
	key: string;
	letter: string;
	label: string;
}

interface SessionQuickNavProps {
	sections: SectionLink[];
}

export function SessionQuickNav({ sections }: SessionQuickNavProps) {
	const [activeSection, setActiveSection] = useState<string>(
		sections[0]?.key ?? "",
	);
	const observerRef = useRef<IntersectionObserver | null>(null);
	const isScrollingRef = useRef(false);

	// IntersectionObserver to highlight the currently visible section
	useEffect(() => {
		observerRef.current = new IntersectionObserver(
			(entries) => {
				if (isScrollingRef.current) return;
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const sectionKey = entry.target
							.getAttribute("id")
							?.replace("section-", "");
						if (sectionKey) {
							setActiveSection(sectionKey);
						}
					}
				}
			},
			{
				rootMargin: "-20% 0px -70% 0px",
				threshold: 0,
			},
		);

		for (const section of sections) {
			const el = document.getElementById(`section-${section.key}`);
			if (el) observerRef.current.observe(el);
		}

		return () => {
			observerRef.current?.disconnect();
		};
	}, [sections]);

	const scrollToSection = useCallback((key: string) => {
		setActiveSection(key);
		isScrollingRef.current = true;
		const el = document.getElementById(`section-${key}`);
		if (el) {
			const isMobile = window.innerWidth < 1024;
			const offset = isMobile ? 160 : 100;
			const top = el.getBoundingClientRect().top + window.scrollY - offset;
			window.scrollTo({ top, behavior: "smooth" });
		}
		setTimeout(() => {
			isScrollingRef.current = false;
		}, 800);
	}, []);

	const navContent = (
		<ul className="space-y-0.5">
			{sections.map((section) => {
				const isActive = activeSection === section.key;
				return (
					<li key={section.key}>
						<a
							href={`#section-${section.key}`}
							onClick={(e) => {
								e.preventDefault();
								scrollToSection(section.key);
							}}
							className={`block py-2 pl-3 pr-2 text-sm transition-all rounded-r-md cursor-pointer ${
								isActive
									? "text-[#a60202] font-semibold border-l-2 border-[#a60202] bg-red-50"
									: "text-gray-600 hover:text-[#a60202] hover:bg-red-50/40 border-l-2 border-transparent hover:border-[#a60202]/40"
							}`}
						>
							<span className="text-[#a60202] font-bold mr-1">
								{section.letter}.
							</span>
							{section.label.replace(/\s+of:$/, "").replace(/:$/, "")}
						</a>
					</li>
				);
			})}
		</ul>
	);

	return (
		<>
			{/* Desktop: Sticky sidebar nav inside a card */}
			<nav
				aria-label="Session agenda navigation"
				className="hidden lg:block sticky top-24 w-64 shrink-0 self-start rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
			>
				<h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 px-3">
					<List className="h-3.5 w-3.5" />
					Sections
				</h3>
				{navContent}
			</nav>

			{/* Mobile: Inline card at top, matching desktop style */}
			<nav
				aria-label="Session agenda navigation"
				className="lg:hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm mb-6"
			>
				<h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 px-3">
					<List className="h-3.5 w-3.5" />
					Quick Navigation
				</h3>
				{navContent}
			</nav>
		</>
	);
}
