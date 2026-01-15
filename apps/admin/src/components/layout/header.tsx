"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Bell, Search } from "lucide-react";

interface HeaderProps {
	title: string;
}

export function Header({ title }: HeaderProps) {
	return (
		<header className="bg-white border-b border-[#e5e7eb] px-6 py-4">
			<div className="flex items-center justify-between">
				{/* Page Title */}
				<h1 className="text-[20px] font-semibold text-[#0a0a0a]">{title}</h1>

				{/* Right Section: Search + Notification */}
				<div className="flex items-center gap-4">
					{/* Search Bar */}
					<div className="relative w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#717182]" />
						<Input
							type="text"
							placeholder="Search..."
							className="w-full bg-[#f3f3f5] border-0 pl-10 pr-4 py-2 text-[14px] placeholder:text-[#717182] focus-visible:ring-1 focus-visible:ring-[#dc2626]"
							disabled
						/>
					</div>

					{/* Notification Bell (optional) */}
					<Button variant="ghost" size="icon" className="size-9 rounded-md">
						<Bell className="size-4 text-[#4a5565]" />
					</Button>
				</div>
			</div>
		</header>
	);
}
