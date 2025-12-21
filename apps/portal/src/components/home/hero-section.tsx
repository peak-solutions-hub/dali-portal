"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { FileText, Search, TrendingUp } from "@repo/ui/lib/lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface HeroSectionProps {
	approvedOrdinances: number;
	approvedResolutions: number;
}

export function HeroSection({
	approvedOrdinances,
	approvedResolutions,
}: HeroSectionProps) {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");

	const handleSearch = (e: FormEvent) => {
		e.preventDefault();

		const trimmedQuery = searchQuery.trim();

		// Blank
		if (!trimmedQuery) {
			return;
		}

		// Valid → redirect
		router.push(
			`/legislative-documents?search=${encodeURIComponent(trimmedQuery)}`,
		);
	};

	return (
		<section className="relative text-white overflow-hidden">
			{/* Background Image */}
			<div
				className="absolute inset-0 bg-cover bg-top"
				style={{
					backgroundImage: "url(/legislative-building.png)",
				}}
			/>

			{/* Gradient Overlay */}
			<div
				className="absolute inset-0"
				style={{
					backgroundImage:
						"linear-gradient(90deg, rgba(166, 2, 2, 0.16) 0%, rgba(166, 2, 2, 0.16) 100%), linear-gradient(270deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.51) 100%), linear-gradient(rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.7) 100%)",
				}}
			/>

			{/* Content */}
			<div className="relative z-10 px-4 w-full max-w-7xl mx-auto pt-32">
				<div className="flex items-center justify-between gap-16 mb-40">
					{/* Left Side - Main Content */}
					<div className="flex-1 max-w-[700px]">
						<div className="mb-8">
							<h1
								className="text-4xl sm:text-5xl lg:text-[72px] lg:leading-[88px] mb-2 font-playfair-display"
								style={{ letterSpacing: "0.08em" }}
							>
								SANGGUNIANG PANLUNGSOD
							</h1>
							<p
								className="text-3xl sm:text-4xl lg:text-[64px] lg:leading-20 font-medium font-playfair-display"
								style={{ letterSpacing: "0.08em" }}
							>
								NG ILOILO
							</p>
						</div>

						<p className="text-lg sm:text-xl lg:text-[24px] leading-normal text-white mb-12">
							Welcome! What are you looking for today?
						</p>

						{/* Search Bar */}
						<form onSubmit={handleSearch}>
							<div className="flex gap-0">
								<div className="relative flex-1">
									<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99A1AF] w-5 h-5" />
									<Input
										placeholder="Search for an ordinance, resolution, or committee report..."
										className="pl-12 h-14 bg-white text-gray-900 border-0 text-sm rounded-r-none focus:ring-2 focus:ring-white"
										value={searchQuery}
										maxLength={2048}
										onChange={(e) => setSearchQuery(e.target.value)}
									/>
								</div>
								<Button
									type="submit"
									className="h-14 px-8 bg-[#a60202] hover:bg-[#8a0101] text-white rounded-l-none font-semibold"
								>
									Search
								</Button>
							</div>
						</form>
					</div>

					{/* Right Side - Performance Indicators */}
					<div className="shrink-0 w-[280px] hidden lg:flex flex-col gap-8">
						{/* Ordinances Enacted */}
						<div className="group">
							<div className="flex items-baseline gap-3 mb-1">
								<span className="text-6xl font-bold text-white/95 font-playfair-display">
									{approvedOrdinances}
								</span>
								<FileText
									className="w-5 h-5 text-white/60 mb-2"
									strokeWidth={1.5}
								/>
							</div>
							<p className="text-white/70 text-sm uppercase tracking-wider pl-1">
								Ordinances Enacted
							</p>
							<div className="h-px bg-linear-to-r from-white/30 to-transparent mt-3" />
						</div>

						{/* Resolutions Adopted */}
						<div className="group">
							<div className="flex items-baseline gap-3 mb-1">
								<span className="text-6xl font-bold text-white/95 font-playfair-display">
									{approvedResolutions}
								</span>
								<TrendingUp
									className="w-5 h-5 text-white/60 mb-2"
									strokeWidth={1.5}
								/>
							</div>
							<p className="text-white/70 text-sm uppercase tracking-wider pl-1">
								Resolutions Adopted
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
