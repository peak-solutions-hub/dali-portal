import { Card } from "@repo/ui/components/card";
import { Calendar, FileText } from "@repo/ui/lib/lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { getSessionTypeBadgeClass } from "@/lib/session-ui";

interface Document {
	id: string;
	number: string;
	title: string;
	type: "Ordinance" | "Resolution";
	month?: string;
	day?: string;
	fullDate?: string;
	author?: string;
	classification?: string;
}

interface Session {
	id: string;
	type: string;
	sessionNumber: string;
	date: string;
	month: string;
	day: string;
	weekday: string;
	fullDate: string;
}

interface RecentUpdatesProps {
	documents: Document[];
	sessions: Session[];
}

export function RecentUpdates({ documents, sessions }: RecentUpdatesProps) {
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
										Latest Ordinances &amp; Resolutions
									</h2>
								</div>
							</div>

							<div className="space-y-3">
								{documents.length > 0 ? (
									documents.map((doc) => {
										const derivedFullDate = doc.fullDate
											? format(new Date(doc.fullDate), "MMMM d, yyyy")
											: doc.month && doc.day
												? `${doc.month} ${doc.day}`
												: "";

										return (
											<Link
												title={`${doc.number} - ${doc.title}`}
												key={doc.id}
												href={`/legislative-documents/${doc.id}`}
												className="block p-4 rounded-lg hover:bg-gray-50 border border-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#a60202] focus:ring-offset-2"
												aria-label={`View ${doc.type.toLowerCase()}: ${doc.number} - ${doc.title}`}
											>
												<div className="flex items-start gap-3">
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2 mb-1">
															<p className="text-xs font-medium rounded bg-[#a60202] px-2.5 py-1 text-white">
																{doc.number}
															</p>
															<span
																className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded font-medium ${
																	doc.type.toLowerCase() === "ordinance"
																		? "bg-blue-100 text-blue-800"
																		: doc.type.toLowerCase() === "resolution"
																			? "bg-green-100 text-green-800"
																			: "bg-gray-100 text-gray-800"
																}`}
															>
																<FileText
																	className="w-3 h-3"
																	aria-hidden="true"
																/>
																{doc.type}
															</span>
														</div>
														<p className="text-sm font-semibold text-gray-700 line-clamp-2">
															{doc.title}
														</p>
														<div className="text-xs text-gray-500 mt-1">
															{doc.author && (
																<span>
																	Author:{" "}
																	<span className="font-medium text-gray-700">
																		{doc.author}
																	</span>
																</span>
															)}
															{doc.classification && (
																<span className="ml-3">
																	Classification:{" "}
																	<span className="font-medium text-gray-700">
																		{doc.classification}
																	</span>
																</span>
															)}
															{derivedFullDate && (
																<div className="mt-1">
																	<span className="text-xs text-gray-500">
																		Date Enacted:{" "}
																	</span>
																	<span className="ml-1 font-medium text-gray-700 text-xs">
																		{derivedFullDate}
																	</span>
																</div>
															)}
														</div>
													</div>
												</div>
											</Link>
										);
									})
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

					{/* Upcoming Sessions Card */}
					<Card className="bg-white border border-gray-200 shadow-sm">
						<div className="p-6">
							<div className="flex items-center justify-between mb-6">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-[#a60202]/10 flex items-center justify-center">
										<Calendar
											className="w-5 h-5 text-[#a60202]"
											aria-hidden="true"
										/>
									</div>
									<h2 className="text-xl font-semibold text-gray-900 font-playfair-display">
										Upcoming Sessions
									</h2>
								</div>
							</div>

							<div className="space-y-6">
								{sessions.length > 0 ? (
									sessions.map((session) => (
										<Link
											key={session.id}
											href={`/sessions/${session.id}`}
											className="block p-4 rounded-lg hover:bg-gray-50 border border-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#a60202] focus:ring-offset-2"
											aria-label={`View ${session.type} Session #${session.sessionNumber} on ${session.fullDate} at 10:00 AM`}
										>
											<div className="flex items-start gap-3">
												<div className="shrink-0">
													<div className="w-12 h-12 rounded-lg bg-[#a60202] flex flex-col items-center justify-center text-white">
														<span className="text-xs font-medium">
															{session.month}
														</span>
														<span className="text-lg font-bold leading-none">
															{session.day}
														</span>
													</div>
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 mb-1">
														<span
															className={`inline-flex h-6 items-center rounded-md px-2 text-xs font-medium text-white ${getSessionTypeBadgeClass((session.type || "").toLowerCase())}`}
														>
															{String(session.type || "")
																.charAt(0)
																.toUpperCase() +
																String(session.type || "").slice(1)}
														</span>
														<p className="text-sm font-semibold text-gray-900">
															Session #{session.sessionNumber}
														</p>
													</div>
													<p className="text-sm text-gray-600 mb-1">
														{session.fullDate}
													</p>
													<p className="text-sm text-gray-500">10:00 AM</p>
													<p className="text-xs text-[#a60202] mt-2 font-medium">
														View Proposed Agenda →
													</p>
												</div>
											</div>
										</Link>
									))
								) : (
									<p className="text-sm text-gray-500 py-8 text-center">
										No upcoming sessions
									</p>
								)}
							</div>

							<div className="mt-6 pt-4 border-t border-gray-200">
								<Link
									href="/sessions"
									className="text-sm font-semibold text-[#a60202] hover:text-[#8a0101] inline-flex items-center gap-2 focus:outline-none focus:underline"
									aria-label="View all sessions"
								>
									View All Sessions
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
