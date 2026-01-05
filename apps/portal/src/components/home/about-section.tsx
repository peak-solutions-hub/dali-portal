"use client";

import { Card } from "@repo/ui/components/card";
import { Calendar, Users } from "@repo/ui/lib/lucide-react";
import Link from "next/link";

interface AboutSectionProps {
	councilorCount: number;
}

export function AboutSection({ councilorCount }: AboutSectionProps) {
	return (
		<section className="bg-white py-16 border-b border-gray-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="max-w-3xl mx-auto text-center mb-12">
					<h2
						className="text-3xl sm:text-4xl mb-4 text-gray-900"
						style={{ fontFamily: "Playfair Display" }}
					>
						About the Sangguniang Panlungsod
					</h2>
					<p className="text-gray-600 leading-relaxed">
						The Sangguniang Panlungsod ng Iloilo serves as the legislative body
						of Iloilo City, dedicated to creating ordinances and resolutions
						that promote the welfare and development of our community. Our
						council works tirelessly to ensure transparent, effective, and
						citizen-centered governance.
					</p>
				</div>

				<div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
					{/* Council Members Count */}
					<Card className="bg-gradient-to-br from-[#a60202] to-[#8a0101] text-white border-0 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden group">
						<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
						<div className="p-6 flex items-center gap-6 relative z-10">
							<div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
								<Users className="w-7 h-7 text-white" />
							</div>
							<div className="flex-1">
								<div
									className="text-4xl mb-1"
									style={{ fontFamily: "Playfair Display" }}
								>
									{councilorCount}
								</div>
								<p className="text-white/90 uppercase tracking-wider text-xs mb-2">
									Council Members
								</p>
								<Link
									href="/council-members"
									className="inline-block text-xs text-white/90 hover:text-white underline"
								>
									Meet Our Council Members →
								</Link>
							</div>
						</div>
					</Card>

					{/* Regular Session Day */}
					<Card className="bg-gradient-to-br from-[#FFC107] to-[#FFB300] text-gray-900 border-0 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden group">
						<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
						<div className="p-6 flex items-center gap-6 relative z-10">
							<div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
								<Calendar className="w-7 h-7 text-gray-900" />
							</div>
							<div className="flex-1">
								<div
									className="text-4xl mb-1"
									style={{ fontFamily: "Playfair Display" }}
								>
									Wednesday
								</div>
								<p className="text-gray-900/80 uppercase tracking-wider text-xs mb-1">
									Regular Session Day
								</p>
								<p className="text-xs text-gray-900/70 mb-2">
									Sessions start at 10:00 AM
								</p>
								<Link
									href="/sessions"
									className="inline-block text-xs text-gray-900/80 hover:text-gray-900 underline"
								>
									View Schedule →
								</Link>
							</div>
						</div>
					</Card>
				</div>
			</div>
		</section>
	);
}
