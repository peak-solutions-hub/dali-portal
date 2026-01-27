import { HeartHandshake, Loader2, MapPin } from "@repo/ui/lib/lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import MapClient from "./map-client";

export function PublicFooter() {
	return (
		<footer className="bg-[#a60202] py-8 sm:py-12">
			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5">
				<div className="space-y-6 sm:space-y-8">
					{/* Main Content Grid */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
						{/* Map Section (server component uses client boundary) */}
						<Suspense
							fallback={
								<div className="flex">
									<div className="bg-white h-75 sm:h-100 lg:h-113 rounded-lg overflow-hidden relative">
										<div className="relative h-full min-h-100 flex items-center justify-center">
											<div className="flex flex-col items-center gap-3">
												<Loader2 className="w-8 h-8 animate-spin text-[#a60202]" />
												<p className="text-sm text-gray-600">Loading map...</p>
											</div>
										</div>
									</div>
								</div>
							}
						>
							<MapClient />
						</Suspense>

						{/* Right Column */}
						<div className="flex flex-col justify-between gap-6">
							{/* Logo and Title */}
							<div className="flex flex-col items-center lg:items-start">
								<div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4">
									<Image
										src="/iloilo-city-seal.png"
										alt="Iloilo City Council Seal"
										width={160}
										height={160}
										className="object-contain"
									/>
								</div>
								<h2 className="text-white text-xl sm:text-2xl text-center lg:text-left font-playfair-display font-normal leading-8">
									Sangguniang Panlungsod ng Iloilo
								</h2>
							</div>

							{/* Address and Quick Links */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
								{/* Address */}
								<div className="space-y-4 text-center lg:text-left">
									<h3 className="text-white text-base font-semibold">
										Address
									</h3>
									<div className="flex items-start gap-2 justify-center lg:justify-start">
										<MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#ffe2e2]" />
										<p className="text-[#ffe2e2] text-xs sm:text-sm leading-5">
											Iloilo Legislative Building, Iloilo City Proper,
											<br />
											Iloilo City, Iloilo
										</p>
									</div>
								</div>

								{/* Quick Links */}
								<div className="space-y-4 text-center lg:text-left">
									<h3 className="text-white text-base font-semibold">
										Quick Links
									</h3>
									<div className="space-y-2 text-xs sm:text-sm">
										<Link
											href="/legislative-documents"
											className="block text-[#ffe2e2] leading-5 hover:text-white transition-colors"
										>
											Legislative Documents
										</Link>
										<Link
											href="/sessions"
											className="block text-[#ffe2e2] leading-5 hover:text-white transition-colors"
										>
											Sessions
										</Link>
										<Link
											href="/inquiries"
											className="block text-[#ffe2e2] leading-5 hover:text-white transition-colors"
										>
											Make an Inquiry
										</Link>
									</div>
								</div>
							</div>

							{/* Office Hours */}
							<div className="space-y-4 text-center lg:text-left">
								<h3 className="text-white text-base font-semibold">
									Office Hours
								</h3>
								<p className="text-[#ffe2e2] text-xs sm:text-sm leading-5">
									Monday - Friday
									<br />
									8:00 AM - 5:00 PM
								</p>
							</div>
						</div>
					</div>

					{/* Copyright */}
					<div className="border-t border-[#c10007] pt-6 sm:pt-8">
						<p className="text-[#ffe2e2] text-xs sm:text-sm text-center leading-5">
							Made with love{" "}
							<HeartHandshake className="inline w-4 h-4 text-[#ffe2e2] mb-0.5" />{" "}
							by
							<Image
								src="/peak-solutions-logo.webp"
								alt="Peak Solutions Logo"
								width={60}
								height={20}
								className="object-contain inline  mb-0.5 cursor-pointer hover:opacity-80"
							/>
							. All rights reserved.
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
