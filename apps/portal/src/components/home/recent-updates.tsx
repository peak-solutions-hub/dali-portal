import { Card } from "@repo/ui/components/card";
import { FileText } from "@repo/ui/lib/lucide-react";
import Link from "next/link";

interface Document {
	id: string;
	number: string;
	title: string;
	type: "Ordinance" | "Resolution";
}

interface RecentUpdatesProps {
	documents: Document[];
}

export function RecentUpdates({ documents }: RecentUpdatesProps) {
	return (
		<section className="bg-gray-50 py-16">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid lg:grid-cols-2 gap-8">
					{/* Latest Ordinances Card */}
					<Card className="bg-white border border-gray-200 shadow-sm">
						<div className="p-6">
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-[#a60202]/10 flex items-center justify-center">
										<FileText
											className="w-5 h-5 text-[#a60202]"
											aria-hidden="true"
										/>
									</div>
									<h2 className="text-xl font-semibold text-gray-900 font-playfair-display">
										Latest Ordinances & Resolutions
									</h2>
								</div>
							</div>

							<div className="space-y-3">
								{documents.length > 0 ? (
									documents.map((doc) => (
										<Link
											key={doc.id}
											href={`/legislative-documents/${doc.id}`}
											className="block p-4 rounded-lg hover:bg-gray-50 border border-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#a60202] focus:ring-offset-2"
											aria-label={`View ${doc.type.toLowerCase()}: ${
												doc.number
											} - ${doc.title}`}
										>
											<div className="flex items-start gap-3">
												<div className="shrink-0 w-2 h-2 rounded-full bg-[#a60202] mt-2" />
												<div className="flex-1 min-w-0">
													<p className="text-sm font-semibold text-[#a60202] mb-1">
														{doc.number}
													</p>
													<p className="text-sm text-gray-700 line-clamp-2">
														{doc.title}
													</p>
												</div>
											</div>
										</Link>
									))
								) : (
									<p className="text-sm text-gray-500 py-8 text-center">
										No documents available
									</p>
								)}
							</div>

							<div className="mt-6 pt-4 border-t border-gray-200">
								<Link
									href="/legislative-documents"
									className="text-sm font-semibold text-[#a60202] hover:text-[#8a0101] inline-flex items-center gap-2 focus:outline-none focus:underline"
									aria-label="View all ordinances and resolutions"
								>
									View All Documents
									<span aria-hidden="true">→</span>
								</Link>
							</div>
						</div>
					</Card>
				</div>
			</div>
		</section>
	);
}
