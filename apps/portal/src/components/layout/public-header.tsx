"use client";

import { Button } from "@repo/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
	SheetTrigger,
} from "@repo/ui/components/sheet";
import { Menu } from "@repo/ui/lib/lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navLinks = [
	{ href: "/", label: "Home" },
	{ href: "/council-members", label: "Council Members" },
	{ href: "/legislative-documents", label: "Legislative Documents" },
	{ href: "/sessions", label: "Sessions" },
	{ href: "/inquiries", label: "Inquiries" },
];

export function PublicHeader() {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const [visible, setVisible] = useState(true);
	const lastScrollYRef = useRef(0);

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			const lastScrollY = lastScrollYRef.current;

			// Show/hide header based on scroll direction
			if (currentScrollY > lastScrollY && currentScrollY > 100) {
				// Scrolling down
				setVisible(false);
			} else {
				// Scrolling up
				setVisible(true);
			}

			lastScrollYRef.current = currentScrollY;
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const isActive = (href: string) => pathname === href;

	return (
		<header
			className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${visible ? "translate-y-0" : "-translate-y-full"}
        bg-[#a60202] shadow-lg
      `}
		>
			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-3 sm:py-4">
				<div className="flex items-center justify-between h-12 sm:h-14">
					{/* Logo and Title */}
					<Link href="/" className="flex items-center gap-3 sm:gap-4">
						<div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0">
							<Image
								src="/iloilo-city-seal.png"
								alt="Iloilo City Council Seal"
								width={56}
								height={56}
								className="object-cover"
							/>
						</div>
						<div className="flex items-center gap-3 sm:gap-4">
							<div className="flex flex-col">
								<h1 className="text-white text-base sm:text-lg font-semibold leading-tight">
									Sangguniang Panlungsod
								</h1>
								<p className="text-white/90 text-xs sm:text-sm">ng Iloilo</p>
							</div>
							<div className="hidden md:block w-px h-10 bg-white/30" />
							<p className="hidden md:block text-white text-base sm:text-lg font-semibold">
								DALI Portal
							</p>
						</div>
					</Link>

					{/* Desktop Navigation */}
					<nav className="hidden lg:flex items-center gap-8">
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								className="relative pb-4 group"
							>
								<span className="text-white text-sm font-medium hover:text-white/80 transition-colors">
									{link.label}
								</span>
								<div
									className={`absolute bottom-0 left-0 right-0 h-1 transition-all ${
										isActive(link.href)
											? "bg-white"
											: "bg-transparent group-hover:bg-white/50"
									}`}
								/>
							</Link>
						))}
					</nav>

					{/* Mobile Menu Button with Sheet */}
					<Sheet open={isOpen} onOpenChange={setIsOpen}>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="lg:hidden text-white hover:bg-white/20"
							>
								<Menu className="w-6 h-6" />
								<span className="sr-only">Open menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="right" className="w-75 sm:w-100 p-6">
							<SheetTitle className="sr-only">Navigation Menu</SheetTitle>
							<SheetDescription className="sr-only">
								Main navigation menu for the Iloilo City Council website
							</SheetDescription>
							<div className="flex items-center gap-3 mb-8 pt-2">
								<Image
									src="/iloilo-city-seal.png"
									alt="Iloilo City Council Seal"
									width={56}
									height={56}
									className="w-12 h-12 object-contain"
								/>
								<div>
									<div className="font-semibold text-gray-900">
										Sangguniang Panlungsod
									</div>
									<div className="text-xs text-gray-600">ng Iloilo</div>
									<div className="text-xs text-[#a60202] font-semibold mt-0.5">
										DALI Portal
									</div>
								</div>
							</div>
							<nav className="flex flex-col gap-3">
								{navLinks.map((link) => {
									const active = pathname === link.href;
									return (
										<Link
											key={link.href}
											href={link.href}
											onClick={() => setIsOpen(false)}
											className={`text-base transition-colors py-3 px-3 rounded-md ${
												active
													? "text-[#a60202] bg-[#FFC107]/10 font-medium border-l-4 border-[#FFC107]"
													: "text-gray-700 hover:text-[#a60202] hover:bg-gray-50"
											}`}
										>
											{link.label}
										</Link>
									);
								})}
							</nav>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
