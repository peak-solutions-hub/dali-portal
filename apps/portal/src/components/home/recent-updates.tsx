"use client";

import { Card } from "@repo/ui/components/card";
import { Calendar, FileText, Loader2 } from "@repo/ui/lib/lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface Document {
	id: string;
	number: string;
	title: string;
	type: "Ordinance" | "Resolution";
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
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [clickedLink, setClickedLink] = useState<string | null>(null);

	const handleNavigation = (href: string) => {
		setClickedLink(href);
		startTransition(() => {
			try {
				router.push(href);
			} catch (error) {
				console.error(
					"Navigation error in RecentUpdates.handleNavigation:",
					error,
				);
				setClickedLink(null);
			}
		});
	};

	const isLoading = (href: string) => isPending && clickedLink === href;

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
									documents.map((doc) => {
										const href = `/legislative-documents/${doc.id}`;
										const loading = isLoading(href);

										return (
											<button
												key={doc.id}
												onClick={() => handleNavigation(href)}
												disabled={loading}
												className="w-full text-left p-4 rounded-lg hover:bg-gray-50 border border-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#a60202] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
												aria-label={`View ${doc.type.toLowerCase()}: ${
													doc.number
												} - ${doc.title}`}
											>
												<div className="flex items-start gap-3">
													{loading ? (
														<Loader2
															className="shrink-0 w-4 h-4 text-[#a60202] animate-spin mt-2"
															aria-hidden="true"
														/>
													) : (
														<div className="shrink-0 w-2 h-2 rounded-full bg-[#a60202] mt-2" />
													)}
													<div className="flex-1 min-w-0">
														<p className="text-sm font-semibold text-[#a60202] mb-1">
															{doc.number}
														</p>
														<p className="text-sm text-gray-700 line-clamp-2">
															{doc.title}
														</p>
													</div>
												</div>
											</button>
										);
									})
								) : (
									<p className="text-sm text-gray-500 py-8 text-center">
										No documents available
									</p>
								)}
							</div>

							<div className="mt-6 pt-4 border-t border-gray-200">
								<button
									onClick={() => handleNavigation("/legislative-documents")}
									disabled={isLoading("/legislative-documents")}
									className="text-sm font-semibold text-[#a60202] hover:text-[#8a0101] inline-flex items-center gap-2 focus:outline-none focus:underline disabled:opacity-60 disabled:cursor-not-allowed"
									aria-label="View all ordinances and resolutions"
								>
									{isLoading("/legislative-documents") ? (
										<>
											<Loader2
												className="w-4 h-4 animate-spin"
												aria-hidden="true"
											/>
											Loading...
										</>
									) : (
										<>
											View All Documents
											<span aria-hidden="true">→</span>
										</>
									)}
								</button>
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

							<div className="space-y-3">
								{sessions.length > 0 ? (
									sessions.map((session) => {
										const href = `/sessions/${session.id}`;
										const loading = isLoading(href);

										return (
											<button
												key={session.id}
												onClick={() => handleNavigation(href)}
												disabled={loading}
												className="w-full text-left p-4 rounded-lg hover:bg-gray-50 border border-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#a60202] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
														<p className="text-sm font-semibold text-gray-900 mb-1">
															{session.type} Session #{session.sessionNumber}
														</p>
														<p className="text-sm text-gray-600 mb-1">
															{session.fullDate}
														</p>
														<p className="text-sm text-gray-500">10:00 AM</p>
														<p className="text-xs text-[#a60202] mt-2 font-medium">
															{loading ? (
																<span className="inline-flex items-center gap-1">
																	<Loader2
																		className="w-3 h-3 animate-spin"
																		aria-hidden="true"
																	/>
																	Loading...
																</span>
															) : (
																"View Proposed Agenda →"
															)}
														</p>
													</div>
												</div>
											</button>
										);
									})
								) : (
									<p className="text-sm text-gray-500 py-8 text-center">
										No upcoming sessions
									</p>
								)}
							</div>

							<div className="mt-6 pt-4 border-t border-gray-200">
								<button
									onClick={() => handleNavigation("/sessions")}
									disabled={isLoading("/sessions")}
									className="text-sm font-semibold text-[#a60202] hover:text-[#8a0101] inline-flex items-center gap-2 focus:outline-none focus:underline disabled:opacity-60 disabled:cursor-not-allowed"
									aria-label="View all sessions"
								>
									{isLoading("/sessions") ? (
										<>
											<Loader2
												className="w-4 h-4 animate-spin"
												aria-hidden="true"
											/>
											Loading...
										</>
									) : (
										<>
											View All Sessions
											<span aria-hidden="true">→</span>
										</>
									)}
								</button>
							</div>
						</div>
					</Card>
				</div>
			</div>
		</section>
	);
}
