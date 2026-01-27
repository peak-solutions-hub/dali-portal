"use client";
import { Loader2, MapPin } from "@repo/ui/lib/lucide-react";
import Link from "next/link";
import { useState } from "react";

const address = "MHVF+F7R, Iloilo City Proper, Iloilo City, Iloilo";
const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
	address,
)}&output=embed`;
const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(
	address,
)}`;

export default function MapClient() {
	const [isMapLoading, setIsMapLoading] = useState(true);

	return (
		<div className="flex">
			<Link
				href={googleMapsUrl}
				target="_blank"
				rel="noopener noreferrer"
				className="block w-full group"
			>
				<div className="bg-white h-75 sm:h-100 lg:h-113 rounded-lg overflow-hidden relative hover:shadow-xl transition-shadow">
					<div className="relative h-full min-h-100">
						{isMapLoading && (
							<div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
								<div className="flex flex-col items-center gap-3">
									<Loader2 className="w-8 h-8 animate-spin text-[#a60202]" />
									<p className="text-sm text-gray-600">Loading map...</p>
								</div>
							</div>
						)}

						<iframe
							src={embedUrl}
							width="100%"
							height="100%"
							style={{ border: 0, minHeight: "400px" }}
							allowFullScreen
							loading="lazy"
							referrerPolicy="no-referrer-when-downgrade"
							className="pointer-events-none"
							onLoad={() => setIsMapLoading(false)}
						/>

						<div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors flex items-center justify-center">
							<div className="bg-[#a60202] text-white px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
								<MapPin className="w-4 h-4" />
								<span className="text-sm">Click to open in Google Maps</span>
							</div>
						</div>
					</div>
				</div>
			</Link>
		</div>
	);
}
