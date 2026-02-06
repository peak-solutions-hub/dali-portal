"use client";

import { ArrowRightLeft, Mail, Phone } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface CouncilMember {
	id: string;
	name: string;
	position: string;
	email: string;
	phone: string;
	imageUrl?: string;
	chairmanships?: string[];
}

interface CouncilMembersListProps {
	members: CouncilMember[];
}

export function CouncilMembersList({ members }: CouncilMembersListProps) {
	const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

	const toggleFlip = (memberId: string) => {
		setFlippedCards((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(memberId)) {
				newSet.delete(memberId);
			} else {
				newSet.add(memberId);
			}
			return newSet;
		});
	};

	// Split members: first 12 in grid, last 2 centered
	const gridMembers = members.slice(0, 12);
	const centeredMembers = members.slice(12);

	const renderMemberCard = (member: CouncilMember) => {
		const isFlipped = flippedCards.has(member.id);
		return (
			<div
				key={member.id}
				className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
				onClick={() => toggleFlip(member.id)}
				style={{ perspective: "1000px" }}
			>
				<div
					className="relative transition-transform duration-600"
					style={{
						transformStyle: "preserve-3d",
						transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
					}}
				>
					{/* Front Side */}
					<div
						className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 relative"
						style={{
							backfaceVisibility: "hidden",
							WebkitBackfaceVisibility: "hidden",
						}}
					>
						{/* Member Photo */}
						<div className="aspect-3/4 bg-gray-200 relative">
							{member.imageUrl ? (
								<Image
									src={member.imageUrl}
									alt={member.name}
									fill
									sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
									className="object-cover md:group-hover:blur-sm transition-all duration-300"
									loading="lazy"
									quality={85}
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center text-gray-400">
									<div className="text-center">
										<div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gray-300" />
										<p className="text-sm">No photo</p>
									</div>
								</div>
							)}

							{/* Hover Overlay - Desktop Only */}
							<div className="hidden md:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center">
								<div className="text-center px-4">
									<p className="text-white font-semibold text-lg mb-2">
										Click to see
									</p>
									<p className="text-white font-semibold text-lg mb-2">
										chairmanships
									</p>
								</div>
							</div>
						</div>

						{/* Member Info */}
						<div className="p-4">
							<div className="flex items-center justify-between mb-1">
								<h3 className="text-lg font-bold text-gray-900 font-playfair-display">
									{member.name}
								</h3>
								{/* Mobile Flip Icon */}
								<ArrowRightLeft className="w-5 h-5 text-red-700 md:hidden shrink-0 ml-2" />
							</div>
							<p className="text-sm text-red-700 font-semibold mb-2">
								{member.position}
							</p>
							<div className="border-t border-gray-200 my-3"></div>

							{/* Contact Links */}
							<div className="space-y-2 text-sm">
								<a
									href={`mailto:${member.email}`}
									className="flex items-center gap-2 text-gray-600 hover:text-red-700 hover:underline"
									onClick={(e) => e.stopPropagation()}
								>
									<Mail className="w-4 h-4 shrink-0 text-red-700" />
									<span className="truncate">{member.email}</span>
								</a>
								<a
									href={`tel:${member.phone}`}
									className="flex items-center gap-2 text-gray-600 hover:text-red-700 hover:underline"
									onClick={(e) => e.stopPropagation()}
								>
									<Phone className="w-4 h-4 shrink-0 text-red-700" />
									<span>{member.phone}</span>
								</a>
							</div>
						</div>
					</div>

					{/* Back Side */}
					<div
						className="absolute inset-0 bg-linear-to-br from-red-50 to-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 p-6"
						style={{
							backfaceVisibility: "hidden",
							WebkitBackfaceVisibility: "hidden",
							transform: "rotateY(180deg)",
						}}
					>
						<div className="flex flex-col h-full">
							<h3 className="text-xl font-bold text-gray-900 mb-4 font-playfair-display">
								{member.name}
							</h3>
							<div className="border-t-2 border-red-700 mb-4"></div>
							<h4 className="text-lg font-semibold text-red-700 mb-3">
								{member.chairmanships && member.chairmanships.length > 1
									? "Chairmanships:"
									: "Chairmanship:"}
							</h4>
							<div className="space-y-2 text-gray-700 flex-1">
								{member.chairmanships && member.chairmanships.length > 0 ? (
									member.chairmanships.map((chairmanship, index) => (
										<p key={index} className="text-sm">
											• {chairmanship}
										</p>
									))
								) : (
									<p className="text-sm text-gray-500">
										No chairmanship assigned
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	return (
		<section className="py-16 px-4 bg-white">
			<div className="max-w-7xl mx-auto">
				{/* Section Header */}
				<div className="text-center mb-12">
					<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-playfair-display">
						City Councilors
					</h2>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto">
						The 12 elected city council members of the Sangguniang Panlungsod ng
						Iloilo, dedicated to serving the people and legislating for the
						city's progress.
					</p>
				</div>

				{/* Members Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{gridMembers.map((member) => renderMemberCard(member))}
				</div>

				{/* Centered Last 2 Members */}
				{centeredMembers.length > 0 && (
					<div className="mt-6 flex justify-center">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
							{centeredMembers.map((member) => renderMemberCard(member))}
						</div>
					</div>
				)}
			</div>
		</section>
	);
}
