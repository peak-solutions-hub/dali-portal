import { Mail, Phone } from "lucide-react";

interface CouncilMember {
	id: string;
	name: string;
	position: string;
	email: string;
	phone: string;
	imageUrl?: string;
}

interface CouncilMembersListProps {
	members: CouncilMember[];
}

export function CouncilMembersList({ members }: CouncilMembersListProps) {
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
					{members.map((member) => (
						<div
							key={member.id}
							className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
						>
							{/* Member Photo */}
							<div className="aspect-3/4 bg-gray-200 relative">
								{member.imageUrl ? (
									<img
										src={member.imageUrl}
										alt={member.name}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-gray-400">
										<div className="text-center">
											<div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gray-300" />
											<p className="text-sm">No photo</p>
										</div>
									</div>
								)}
							</div>

							{/* Member Info */}
							<div className="p-4">
								<h3 className="text-lg font-bold text-gray-900 mb-1 font-playfair-display">
									{member.name}
								</h3>
								<p className="text-sm text-red-700 font-semibold mb-2">
									{member.position}
								</p>
								<div className="border-t border-gray-200 my-3"></div>

								{/* Contact Links */}
								<div className="space-y-2 text-sm">
									<a
										href={`mailto:${member.email}`}
										className="flex items-center gap-2 text-gray-600 hover:text-red-700 hover:underline"
									>
										<Mail className="w-4 h-4 shrink-0 text-red-700" />
										<span className="truncate">{member.email}</span>
									</a>
									<a
										href={`tel:${member.phone}`}
										className="flex items-center gap-2 text-gray-600 hover:text-red-700 hover:underline"
									>
										<Phone className="w-4 h-4 shrink-0 text-red-700" />
										<span>{member.phone}</span>
									</a>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
