import { isDefinedError } from "@orpc/client";
import {
	formatSessionDate,
	formatSessionTime,
	transformSessionWithAgendaDates,
} from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { ChevronLeft, Download } from "@repo/ui/lib/lucide-react";
import {
	formatAgendaItemNumber,
	getClassificationLabel,
	getSectionLabel,
	getSectionLetter,
	getSessionStatusBadgeClass,
	getSessionStatusLabel,
	getSessionTypeBadgeClass,
	getSessionTypeLabel,
	SESSION_SECTION_ORDER,
} from "@repo/ui/lib/session-ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScrollToTop } from "@/components/scroll-to-top";
import {
	DocumentViewButton,
	SessionQuickNav,
	SessionViewSwitcher,
} from "@/components/sessions";
import { api } from "@/lib/api.client";

interface PageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { id } = await params;

	// Validate UUID format
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(id)) {
		return {
			title: "Invalid Session",
			description: "Invalid session ID.",
		};
	}

	const [error, sessionData] = await api.sessions.getById({ id });

	if (error || !sessionData) {
		return {
			title: "Session Not Found",
			description: "The requested council session could not be found.",
		};
	}

	const session = transformSessionWithAgendaDates(sessionData);

	const scheduleDate = new Date(session.scheduleDate);
	const formattedDate = formatSessionDate(scheduleDate);
	const formattedTime = formatSessionTime(scheduleDate);
	const sessionType = getSessionTypeLabel(session.type);
	const sessionStatus = getSessionStatusLabel(session.status);
	const agendaCount = session.agendaItems?.length || 0;

	const title = `Session #${session.sessionNumber} - ${formattedDate}`;
	const description = `${sessionType} on ${formattedDate} at ${formattedTime}. ${agendaCount} agenda ${agendaCount === 1 ? "item" : "items"}. Status: ${sessionStatus}.`;

	return {
		title,
		description: description.substring(0, 160), // Limit to 160 chars for SEO
		openGraph: {
			title,
			description,
			type: "article",
			publishedTime: scheduleDate.toISOString(),
			url: `/sessions/${id}`,
		},
		twitter: {
			card: "summary_large_image",
			title,
			description: description.substring(0, 160),
		},
	};
}

// Async component that fetches and displays session detail
async function SessionDetailContent({
	id,
	searchParams,
}: {
	id: string;
	searchParams: { [key: string]: string | string[] | undefined };
}) {
	// Fetch session from API
	const [error, sessionData] = await api.sessions.getById({ id });

	// Handle errors - use generic error to prevent enumeration
	if (error) {
		if (isDefinedError(error) && error.code === "NOT_FOUND") {
			notFound();
		}
		// For other errors, also return not found to prevent enumeration
		notFound();
	}

	if (!sessionData) {
		notFound();
	}

	// Transform date strings to Date objects
	const session = transformSessionWithAgendaDates(sessionData);

	// Ensure scheduleDate is a Date object
	const scheduleDate = new Date(session.scheduleDate);

	// Build back URL preserving view state and filters
	const params = new URLSearchParams();
	Object.entries(searchParams).forEach(([key, value]) => {
		if (value) {
			if (Array.isArray(value)) {
				value.map((v) => params.append(key, v));
			} else {
				params.append(key, value as string);
			}
		}
	});

	// If no params, default to sessions root, otherwise append query string
	const queryString = params.toString();
	const backUrl = queryString ? `/sessions?${queryString}` : "/sessions";

	// Build section data for quick nav
	const sectionLinks = SESSION_SECTION_ORDER.map((key) => ({
		key,
		letter: getSectionLetter(key),
		label: getSectionLabel(key),
	}));

	return (
		<>
			{/* Back Button — sticky below fixed header */}
			<div className="sticky top-18 sm:top-22 z-30 bg-white border-b border-gray-200 shadow-sm">
				<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-4">
					<Link href={backUrl} className="inline-block">
						<Button
							variant="outline"
							size="sm"
							aria-label="Back to Sessions"
							className="cursor-pointer"
						>
							<ChevronLeft className="size-4" />
							Back to Sessions
						</Button>
					</Link>
				</div>
			</div>
			{/* Main Card */}
			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-6 sm:py-8">
				<div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 md:p-8 shadow-sm">
					{/* Session Header */}
					<div className="mb-8 md:mb-12 space-y-4">
						{/* Badges */}
						<div className="flex flex-wrap items-center gap-2 sm:gap-3">
							<Badge
								variant="default"
								className={`font-medium text-white text-xs sm:text-sm ${getSessionTypeBadgeClass(session.type)}`}
								aria-label={`Session type: ${getSessionTypeLabel(session.type)}`}
							>
								{getSessionTypeLabel(session.type)}
							</Badge>
							<Badge
								variant="default"
								className={`font-medium text-white text-xs sm:text-sm ${getSessionStatusBadgeClass(session.status)}`}
								aria-label={`Session status: ${getSessionStatusLabel(session.status)}`}
							>
								{getSessionStatusLabel(session.status)}
							</Badge>
							<span className="text-xs sm:text-sm text-[#4a5565]">
								Session #{session.sessionNumber}
							</span>
						</div>

						{/* Date */}
						<h1 className="font-serif text-2xl sm:text-3xl font-normal text-primary">
							{formatSessionDate(scheduleDate)}
						</h1>

						{/* Time */}
						<div className="flex items-center gap-2">
							<span className="text-base sm:text-lg font-medium text-gray-900">
								Time:
							</span>
							<time className="text-base sm:text-lg text-gray-900">
								{formatSessionTime(scheduleDate)}
							</time>
						</div>

						{/* Download PDF - always visible, disabled when no file */}
						<button
							type="button"
							disabled={!session.agendaFilePath}
							className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
								session.agendaFilePath
									? "border-[#a60202] text-[#a60202] hover:bg-red-50"
									: "border-gray-300 text-gray-400 cursor-not-allowed"
							}`}
							aria-label={
								session.agendaFilePath
									? "Download session agenda PDF"
									: "No PDF available"
							}
						>
							<Download className="h-4 w-4" />
							Download PDF
						</button>
					</div>

					{/* Session Agenda */}
					<div className="border-t border-gray-200 pt-8">
						<SessionViewSwitcher
							session={session}
							agendaFilePath={session.agendaFilePath}
						>
							{/* Web View: mobile pills on top, desktop sidebar beside sections */}
							<div className="flex flex-col lg:flex-row lg:gap-8">
								<SessionQuickNav sections={sectionLinks} />

								{/* Agenda Sections */}
								<div className="flex-1 min-w-0 space-y-6">
									{SESSION_SECTION_ORDER.map((sectionKey) => {
										const letter = getSectionLetter(sectionKey);
										const label = getSectionLabel(sectionKey);
										const sectionItems = session.agendaItems.filter(
											(item) => item.section === sectionKey,
										);

										// Separate parent text items (no linked document) from document sub-items
										const textItems = sectionItems.filter(
											(item) => !item.document,
										);
										const docItems = sectionItems.filter(
											(item) => !!item.document,
										);

										// For minutes section: merge contentText into section header
										const isMinutes =
											sectionKey === "reading_and_or_approval_of_the_minutes";
										const minutesText = isMinutes
											? textItems[0]?.contentText
											: null;

										// For committee reports: group documents by classification (from document type)
										const isCommitteeReports =
											sectionKey === "committee_reports";

										return (
											<div
												key={sectionKey}
												id={`section-${sectionKey}`}
												className="border-l-4 border-primary pl-2 sm:pl-7 py-2"
											>
												{/* Section Header */}
												{isMinutes && minutesText ? (
													<h3 className="text-sm sm:text-base font-semibold text-red-700">
														{letter}. {minutesText}
													</h3>
												) : (
													<h3 className="text-sm sm:text-base font-semibold text-red-700">
														{letter}. {label}
													</h3>
												)}

												{sectionItems.length > 0 && (
													<div className="mt-3 space-y-4">
														{/* Section-level text (skip minutes text, already in header) */}
														{textItems
															.filter(
																(item) => !(isMinutes && item === textItems[0]),
															)
															.map((item) => (
																<div
																	key={item.id}
																	className="space-y-2 ml-1 sm:ml-6"
																>
																	{item.contentText && (
																		<div
																			className="text-xs sm:text-sm text-gray-800 wrap-break-word [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:space-y-1 [&>ol]:list-decimal [&>ol]:ml-5 [&>ol]:space-y-1 [&_li]:pl-1"
																			dangerouslySetInnerHTML={{
																				__html: item.contentText,
																			}}
																		/>
																	)}
																	{item.attachmentPath &&
																		item.attachmentName && (
																			<div className="mt-2">
																				<span className="text-xs sm:text-sm text-gray-500">
																					Attachment: {item.attachmentName}
																				</span>
																			</div>
																		)}
																</div>
															))}

														{/* Committee Reports: grouped by classification */}
														{isCommitteeReports && docItems.length > 0
															? (() => {
																	// Group documents by classification
																	const groups: Record<
																		string,
																		typeof docItems
																	> = {};
																	for (const item of docItems) {
																		const doc = item.document!;
																		const isVisible =
																			doc.status === "published" ||
																			doc.purpose === "for_agenda";
																		if (!isVisible) continue;
																		const key =
																			doc.classification || "uncategorized";
																		if (!groups[key]) groups[key] = [];
																		groups[key].push(item);
																	}
																	const groupEntries = Object.entries(groups);
																	if (groupEntries.length === 0) return null;

																	return groupEntries.map(
																		([classification, items], groupIdx) => (
																			<div
																				key={classification}
																				className="space-y-3"
																			>
																				<h4 className="text-xs sm:text-sm font-semibold text-gray-900 sm:ml-6">
																					{groupIdx + 1}. COMMITTEE ON{" "}
																					{getClassificationLabel(
																						classification,
																					).toUpperCase()}
																				</h4>
																				{items.map((item) => {
																					const doc = item.document!;

																					return (
																						<div
																							key={item.id}
																							className="flex items-start gap-1.5 sm:gap-3 ml-1 sm:ml-12 rounded-md px-1 sm:px-2 py-1.5 -mx-1 sm:-mx-2 hover:bg-gray-50 transition-colors"
																						>
																							<div className="flex-1 min-w-0 text-xs sm:text-sm text-gray-900 wrap-break-word">
																								{item.contentText ? (
																									<span
																										className="[&>p]:inline [&>p]:m-0"
																										dangerouslySetInnerHTML={{
																											__html: item.contentText,
																										}}
																									/>
																								) : (
																									<span>{doc.title}</span>
																								)}
																							</div>
																							<DocumentViewButton
																								documentId={doc.id}
																								codeNumber={doc.codeNumber}
																								documentTitle={doc.title}
																								documentType={doc.type}
																								classification={
																									doc.classification
																								}
																								receivedAt={doc.receivedAt}
																								authors={doc.authors}
																								sponsors={doc.sponsors}
																							/>
																						</div>
																					);
																				})}
																			</div>
																		),
																	);
																})()
															: /* Non-committee document sub-items with sub-index (e.01, f.01) */
																docItems.map((item, docIndex) => {
																	const subNumber = formatAgendaItemNumber(
																		sectionKey,
																		docIndex,
																		true,
																	);
																	const doc = item.document!;
																	const isVisible =
																		doc.status === "published" ||
																		doc.purpose === "for_agenda";

																	if (!isVisible) return null;

																	return (
																		<div
																			key={item.id}
																			className="flex items-start gap-1.5 sm:gap-3 ml-1 sm:ml-6 rounded-md px-1.5 sm:px-2 py-1.5 -mx-1.5 sm:-mx-2 hover:bg-gray-50 transition-colors"
																		>
																			<div className="flex-1 min-w-0 text-xs sm:text-sm text-gray-900 wrap-break-word">
																				<span className="font-semibold text-gray-900">
																					{subNumber}
																				</span>{" "}
																				{item.contentText ? (
																					<span
																						className="[&>p]:inline [&>p]:m-0"
																						dangerouslySetInnerHTML={{
																							__html: item.contentText,
																						}}
																					/>
																				) : (
																					<span>{doc.title}</span>
																				)}
																			</div>
																			<DocumentViewButton
																				documentId={doc.id}
																				codeNumber={doc.codeNumber}
																				documentTitle={doc.title}
																				documentType={doc.type}
																				classification={doc.classification}
																				receivedAt={doc.receivedAt}
																				authors={doc.authors}
																				sponsors={doc.sponsors}
																			/>
																		</div>
																	);
																})}
													</div>
												)}
											</div>
										);
									})}
								</div>
							</div>
						</SessionViewSwitcher>
					</div>
				</div>
			</div>
		</>
	);
}

export default async function SessionDetailPage({
	params,
	searchParams,
}: PageProps) {
	const { id } = await params;
	const urlParams = await searchParams;

	// Validate UUID format before making API call
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(id)) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-[#f9fafb]">
			<ScrollToTop />
			<SessionDetailContent id={id} searchParams={urlParams} />
		</div>
	);
}
