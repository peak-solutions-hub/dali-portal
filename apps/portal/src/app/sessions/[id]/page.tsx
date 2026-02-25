import { isDefinedError } from "@orpc/client";
import {
	formatSessionDate,
	formatSessionTime,
	transformSessionWithAgendaDates,
} from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { ChevronLeft } from "@repo/ui/lib/lucide-react";
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
import parse from "html-react-parser";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScrollToTop } from "@/components/scroll-to-top";
import {
	DocumentViewButton,
	DownloadAgendaButton,
	SessionQuickNav,
	SessionViewSwitcher,
} from "@/components/sessions";
import { api } from "@/lib/api.client";
import { sanitizeQuillHtmlServer } from "@/utils/quill-html-utils.server";

interface PageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { id } = await params;
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(id)) {
		return { title: "Invalid Session", description: "Invalid session ID." };
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
		description: description.substring(0, 160),
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

// ---------------------------------------------------------------------------
// QuillContent
// ---------------------------------------------------------------------------
function QuillContent({
	html,
	inline = false,
}: {
	html: string | null | undefined;
	inline?: boolean;
}) {
	if (!html) return null;
	const safe = sanitizeQuillHtmlServer(html);
	if (!safe) return null;
	if (inline) {
		return <span className="portal-inline">{parse(safe)}</span>;
	}
	return <div className="portal-content">{parse(safe)}</div>;
}

// ---------------------------------------------------------------------------
// SessionDetailContent
// ---------------------------------------------------------------------------
async function SessionDetailContent({
	id,
	searchParams,
}: {
	id: string;
	searchParams: { [key: string]: string | string[] | undefined };
}) {
	const [error, sessionData] = await api.sessions.getById({ id });
	if (error) {
		if (isDefinedError(error) && error.code === "NOT_FOUND") notFound();
		notFound();
	}
	if (!sessionData) notFound();

	const session = transformSessionWithAgendaDates(sessionData);
	const scheduleDate = new Date(session.scheduleDate);

	const urlParams = new URLSearchParams();
	Object.entries(searchParams).forEach(([key, value]) => {
		if (value) {
			if (Array.isArray(value)) value.forEach((v) => urlParams.append(key, v));
			else urlParams.append(key, value as string);
		}
	});
	const queryString = urlParams.toString();
	const backUrl = queryString ? `/sessions?${queryString}` : "/sessions";

	const sectionLinks = SESSION_SECTION_ORDER.map((key) => ({
		key,
		letter: getSectionLetter(key),
		label: getSectionLabel(key),
	}));

	return (
		<>
			{/* ── Back button ── */}
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

			{/* ── Main card ── */}
			<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-6 sm:py-8">
				<div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 md:p-8 shadow-sm">
					{/* Session header */}
					<div className="mb-8 md:mb-12 space-y-4">
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

						<h1 className="font-serif text-2xl sm:text-3xl font-normal text-primary">
							{formatSessionDate(scheduleDate)}
						</h1>

						<div className="flex items-center gap-2">
							<span className="text-base sm:text-lg font-medium text-gray-900">
								Time:
							</span>
							<time className="text-base sm:text-lg text-gray-900">
								{formatSessionTime(scheduleDate)}
							</time>
						</div>

						<DownloadAgendaButton
							sessionId={session.id}
							agendaFilePath={session.agendaFilePath}
						/>
					</div>

					{/* Agenda */}
					<div className="border-t border-gray-200 pt-8">
						<SessionViewSwitcher
							session={session}
							agendaFilePath={session.agendaFilePath}
						>
							<div className="flex flex-col lg:flex-row lg:gap-8">
								<SessionQuickNav sections={sectionLinks} />

								{/* ── Sections ── */}
								<div className="flex-1 min-w-0 space-y-8">
									{SESSION_SECTION_ORDER.map((sectionKey) => {
										const letter = getSectionLetter(sectionKey);
										const label = getSectionLabel(sectionKey);

										const sectionItems = session.agendaItems.filter(
											(item) => item.section === sectionKey,
										);
										const sortedSectionItems = [...sectionItems].sort(
											(a, b) => a.orderIndex - b.orderIndex,
										);
										const textItems = sectionItems.filter(
											(item) => !item.document,
										);
										const pureTextItems = textItems.filter(
											(item) =>
												!(item as { isCustomText?: boolean }).isCustomText &&
												!item.contentText?.startsWith("<!--classification:"),
										);

										const isMinutes =
											sectionKey === "reading_and_or_approval_of_the_minutes";
										const isCommitteeReports =
											sectionKey === "committee_reports";

										const minutesText = isMinutes
											? pureTextItems[0]?.contentText
											: null;

										const minutesPlainText = minutesText
											? minutesText.replace(/<[^>]*>/g, "").trim()
											: null;
										const minutesHasDate = minutesPlainText
											? /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b.+\d{4}/.test(
													minutesPlainText,
												)
											: false;
										const minutesHeadingText =
											isMinutes && minutesHasDate ? minutesPlainText : null;

										return (
											<div
												key={sectionKey}
												id={`section-${sectionKey}`}
												className="border-l-4 border-primary pl-3 sm:pl-6 py-1"
											>
												<h3 className="flex items-start gap-3 text-sm sm:text-base font-semibold text-red-700 leading-snug">
													<span className="shrink-0 w-5 sm:w-7">{letter}.</span>
													<span>{minutesHeadingText ?? label}</span>
												</h3>

												{sectionItems.length > 0 && (
													<div className="mt-3 space-y-4">
														{/* ── Committee reports ── */}
														{isCommitteeReports
															? (() => {
																	const CLASSIFICATION_RE =
																		/^<!--classification:(.*?)-->/;

																	type AnyItem =
																		(typeof sortedSectionItems)[number] & {
																			_cleanContent?: string;
																		};
																	const groups: Record<string, AnyItem[]> = {};

																	for (const item of sortedSectionItems) {
																		if (item.document) {
																			const doc = item.document;
																			if (
																				doc.status !== "published" &&
																				doc.purpose !== "for_agenda"
																			)
																				continue;
																			const key =
																				doc.classification || "uncategorized";
																			groups[key] ??= [];
																			groups[key].push(item as AnyItem);
																		} else if (
																			!item.document &&
																			item.contentText?.startsWith(
																				"<!--classification:",
																			)
																		) {
																			const match =
																				item.contentText.match(
																					CLASSIFICATION_RE,
																				);
																			const key = match?.[1] || "uncategorized";
																			const cleanContent =
																				item.contentText.replace(
																					CLASSIFICATION_RE,
																					"",
																				);
																			groups[key] ??= [];
																			groups[key].push({
																				...item,
																				_cleanContent: cleanContent,
																			} as AnyItem);
																		}
																	}

																	const groupEntries = Object.entries(groups);
																	if (!groupEntries.length) return null;

																	for (const [, items] of groupEntries) {
																		items.sort(
																			(a, b) => a.orderIndex - b.orderIndex,
																		);
																	}

																	return (
																		<div className="space-y-5">
																			{groupEntries.map(
																				([classification, items], groupIdx) => (
																					<div
																						key={classification}
																						className="space-y-2"
																					>
																						{/* ── Committee name row ──
																						    "1." + "COMMITTEE ON …" aligned with
																						    section label text (ml-8 sm:ml-10)
																						    matching non-committee item rows. */}
																						<div className="flex items-start gap-3 ml-8 sm:ml-10">
																							<span className="text-xs sm:text-sm font-bold text-gray-900 shrink-0 w-5 sm:w-7 leading-snug pt-px">
																								{groupIdx + 1}.
																							</span>
																							<h4 className="text-xs sm:text-sm font-bold text-gray-900 uppercase leading-snug flex-1 min-w-0">
																								COMMITTEE ON{" "}
																								{getClassificationLabel(
																									classification,
																								).toUpperCase()}
																							</h4>
																						</div>
																						{/* Sub-items: indent = ml-8/ml-10 (row) + w-5/w-7 (num col) + gap-3
																						    so "a." aligns exactly with "COMMITTEE ON…" text */}
																						<div className="ml-[4rem] sm:ml-[5rem] space-y-1">
																							{items.map((item, itemIdx) => {
																								const subLetter = `${String.fromCharCode(97 + itemIdx)}.`;
																								if (
																									item._cleanContent !==
																									undefined
																								) {
																									return (
																										<div
																											key={item.id}
																											className="flex items-start gap-3 rounded-sm py-0.5 hover:bg-gray-50 transition-colors -mx-1 px-1"
																										>
																											<span className="text-xs sm:text-sm font-semibold text-gray-700 shrink-0 w-5 sm:w-7 leading-snug pt-px">
																												{subLetter}
																											</span>
																											<div className="flex-1 min-w-0 leading-snug">
																												{item._cleanContent && (
																													<QuillContent
																														html={
																															item._cleanContent
																														}
																													/>
																												)}
																											</div>
																										</div>
																									);
																								}

																								const doc = item.document!;
																								return (
																									<div
																										key={item.id}
																										className="flex items-start gap-3 rounded-sm py-0.5 hover:bg-gray-50 transition-colors -mx-1 px-1"
																									>
																										<span className="text-xs sm:text-sm font-semibold text-gray-700 shrink-0 w-5 sm:w-7 leading-snug pt-px">
																											{subLetter}
																										</span>
																										<div className="flex-1 min-w-0 leading-snug">
																											{item.contentText ? (
																												<QuillContent
																													html={
																														item.contentText
																													}
																												/>
																											) : (
																												<span className="text-xs sm:text-sm text-gray-900">
																													{doc.title}
																												</span>
																											)}
																										</div>
																										<DocumentViewButton
																											documentId={doc.id}
																											codeNumber={
																												doc.codeNumber
																											}
																											documentTitle={doc.title}
																											documentType={doc.type}
																											classification={
																												doc.classification
																											}
																											receivedAt={
																												doc.receivedAt
																											}
																											authors={doc.authors}
																											sponsors={doc.sponsors}
																										/>
																									</div>
																								);
																							})}
																						</div>
																					</div>
																				),
																			)}
																		</div>
																	);
																})()
															: (() => {
																	const mixedItems = sortedSectionItems.filter(
																		(si) => {
																			if (si.document) {
																				const doc = si.document;
																				return (
																					doc.status === "published" ||
																					doc.purpose === "for_agenda"
																				);
																			}
																			const isCustom = (
																				si as { isCustomText?: boolean }
																			).isCustomText;
																			if (isCustom) return true;
																			if (
																				isMinutes &&
																				minutesHeadingText &&
																				si === pureTextItems[0]
																			)
																				return false;
																			return !!si.contentText;
																		},
																	);
																	return mixedItems.map((si, mixedIndex) => {
																		const subNumber = formatAgendaItemNumber(
																			sectionKey,
																			mixedIndex,
																			true,
																		);
																		const isCustomTextItem = (
																			si as { isCustomText?: boolean }
																		).isCustomText;
																		const isPureText =
																			!si.document && !isCustomTextItem;
																		if (isCustomTextItem || isPureText) {
																			return (
																				<div
																					key={si.id}
																					className="flex items-start gap-3 ml-8 sm:ml-10 rounded-sm py-0.5 hover:bg-gray-50 transition-colors -mx-1 px-1"
																				>
																					<span className="text-xs sm:text-sm font-semibold text-gray-700 shrink-0 leading-snug pt-px">
																						{subNumber}
																					</span>
																					<div className="flex-1 min-w-0 leading-snug">
																						{si.contentText && (
																							<QuillContent
																								html={si.contentText}
																							/>
																						)}
																					</div>
																				</div>
																			);
																		}
																		const doc = si.document!;
																		return (
																			<div
																				key={si.id}
																				className="flex items-start gap-3 ml-8 sm:ml-10 rounded-sm py-0.5 hover:bg-gray-50 transition-colors -mx-1 px-1"
																			>
																				<span className="text-xs sm:text-sm font-semibold text-gray-700 shrink-0 leading-snug pt-px">
																					{subNumber}
																				</span>
																				<div className="flex-1 min-w-0 leading-snug">
																					{si.contentText ? (
																						<QuillContent
																							html={si.contentText}
																						/>
																					) : (
																						<span className="text-xs sm:text-sm text-gray-900">
																							{doc.title}
																						</span>
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
																	});
																})()}{" "}
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

			<style>{`
				/* ── Block mode ──────────────────────────────────────────────── */
				.portal-content {
					font-size: 0.875rem;
					line-height: 1.6;
					color: #1f2937;
					overflow-wrap: break-word;
					word-break: normal;
				}
				@media (max-width: 639px) {
					.portal-content { font-size: 0.75rem; }
				}
				.portal-content p { margin: 0; padding: 0; min-height: 1.6em; }
				.portal-content p.ql-indent-1,
				.portal-content .ql-indent-1:not(li) { padding-left: 3em; }
				.portal-content p.ql-indent-2,
				.portal-content .ql-indent-2:not(li) { padding-left: 6em; }
				.portal-content p.ql-indent-3,
				.portal-content .ql-indent-3:not(li) { padding-left: 9em; }
				.portal-content p.ql-indent-4,
				.portal-content .ql-indent-4:not(li) { padding-left: 12em; }
				.portal-content p.ql-indent-5,
				.portal-content .ql-indent-5:not(li) { padding-left: 15em; }
				.portal-content ul, .portal-content ol { margin: 0.35em 0; padding-left: 1.75em; list-style-position: outside; }
				.portal-content ul { list-style-type: disc; }
				.portal-content ol { list-style-type: decimal; }
				.portal-content li { display: list-item; margin: 0.15em 0; padding-left: 0.25em; }
				.portal-content li.ql-indent-1 { padding-left: 4.5em;  list-style-type: circle; }
				.portal-content li.ql-indent-2 { padding-left: 7.5em;  list-style-type: square; }
				.portal-content li.ql-indent-3 { padding-left: 10.5em; list-style-type: disc;   }
				.portal-content li.ql-indent-4 { padding-left: 13.5em; list-style-type: circle; }
				.portal-content li.ql-indent-5 { padding-left: 16.5em; list-style-type: square; }
				.portal-content strong { font-weight: 700; }
				.portal-content em     { font-style: italic; }
				.portal-content u      { text-decoration: underline; }
				.portal-content s      { text-decoration: line-through; }
				.portal-content sup    { vertical-align: super; font-size: 0.75em; line-height: 0; }
				.portal-content sub    { vertical-align: sub;   font-size: 0.75em; line-height: 0; }
				.portal-content .ql-align-center  { text-align: center; }
				.portal-content .ql-align-right   { text-align: right; }
				.portal-content .ql-align-justify,
				.portal-content [style*="text-align: justify"] {
					text-align: justify; text-align-last: left; hyphens: auto; -webkit-hyphens: auto; word-spacing: -0.01em;
				}
				/* ── Inline mode ─────────────────────────────────────────────── */
				.portal-inline { font-size: 0.875rem; line-height: 1.5; color: #111827; overflow-wrap: break-word; word-break: normal; }
				@media (max-width: 639px) { .portal-inline { font-size: 0.75rem; } }
				.portal-inline p { display: inline; margin: 0; padding: 0; }
				.portal-inline ul, .portal-inline ol { display: block; margin: 0.25em 0; padding-left: 1.5em; list-style-position: outside; }
				.portal-inline ul { list-style-type: disc; }
				.portal-inline ol { list-style-type: decimal; }
				.portal-inline li { display: list-item; margin: 0.1em 0; padding-left: 0.25em; }
				.portal-inline strong { font-weight: 700; }
				.portal-inline em     { font-style: italic; }
				.portal-inline u      { text-decoration: underline; }
				.portal-inline s      { text-decoration: line-through; }
				.portal-inline sup    { vertical-align: super; font-size: 0.75em; line-height: 0; }
				.portal-inline sub    { vertical-align: sub;   font-size: 0.75em; line-height: 0; }
			`}</style>
		</>
	);
}

export default async function SessionDetailPage({
	params,
	searchParams,
}: PageProps) {
	const { id } = await params;
	const urlParams = await searchParams;
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(id)) notFound();
	return (
		<div className="min-h-screen bg-[#f9fafb]">
			<ScrollToTop />
			<SessionDetailContent id={id} searchParams={urlParams} />
		</div>
	);
}
