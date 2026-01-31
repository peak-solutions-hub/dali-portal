import { Mail, Phone } from "lucide-react";

interface ViceMayorProps {
	name: string;
	position: string;
	email: string;
	phone: string;
	imageUrl?: string;
}

export function ViceMayor({
	name,
	position,
	email,
	phone,
	imageUrl,
}: ViceMayorProps) {
	return (
		<section className="py-16 px-4 bg-gray-50">
			<div className="max-w-7xl mx-auto">
				{/* Badge */}
				<div className="flex justify-center mb-8">
					<span className="inline-flex items-center px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-full uppercase tracking-wide">
						Presiding Officer
					</span>
				</div>

				{/* Vice Mayor Card */}
				<div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-4xl mx-auto">
					<div className="md:flex">
						{/* Image Section */}
						<div className="md:w-2/5 relative">
							<div className="aspect-3/4 relative bg-gray-200">
								{imageUrl ? (
									<img
										src={imageUrl}
										alt={name}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-gray-400">
										<div className="text-center">
											<p className="text-sm">No image available</p>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Info Section */}
						<div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
							<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 font-playfair-display">
								{name}
							</h2>
							<p className="text-xl text-red-700 font-semibold mb-2">
								{position}
							</p>
							<div className="border-t border-gray-200 my-3"></div>
							{/* Email */}
							<div className="space-y-2">
								<div className="flex items-start">
									<Mail
										className="w-5 h-5 mr-3 text-red-700 shrink-0"
										strokeWidth={1.5}
									/>
									<a
										href={`mailto:${email}`}
										className="text-gray-700 hover:text-red-800 hover:underline"
									>
										{email}
									</a>
								</div>

								{/* Phone */}
								<div className="flex items-start">
									<Phone
										className="w-5 h-5 mr-3 text-red-700 shrink-0"
										strokeWidth={1.5}
									/>
									<a
										href={`tel:${phone}`}
										className="text-gray-700 hover:text-red-800 hover:underline"
									>
										{phone}
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
