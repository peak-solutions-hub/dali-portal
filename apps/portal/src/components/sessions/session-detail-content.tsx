import { isDefinedError } from "@orpc/client";
import {
	formatSessionDate,
	formatSessionTime,
	transformSessionWithAgendaDates,
} from "@repo/shared";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { PageError } from "@repo/ui/components/page-error";
import { ChevronLeft, RefreshCw } from "@repo/ui/lib/lucide-react";
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
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api.client";
import { DocumentViewButton } from "./document-view-button";
import { DownloadAgendaButton } from "./download-agenda-button";
import { QuillContent } from "./quill-content";
import { SessionDetailStyles } from "./session-detail-styles";
import { SessionQuickNav } from "./session-quick-nav";
import { SessionViewSwitcher } from "./session-view-switcher";

export async function SessionDetailContent({
	id,
	searchParams,
}: {
	id: string;
	searchParams: { [key: string]: string | string[] | undefined };
}) {
	const [error, sessionData] = await api.sessions.getById({ id });
	if (error) {
		if (isDefinedError(error) && error.code === "SESSION.NOT_FOUND") notFound();
		// Render a user-friendly error card for other failures
		const errorDetail = isDefinedError(error) ? error.message : undefined;
		return (
			<>
				<div className="sticky top-18 sm:top-22 z-30 bg-white border-b border-gray-200 shadow-sm">
					<div className="container mx-auto px-4 sm:px-6 lg:px-19.5 py-4">
						<Link href="/sessions" className="inline-block">
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
				<div className="flex min-h-[calc(100svh-9rem)] sm:min-h-[calc(100svh-10rem)] items-center justify-center px-4 sm:px-6 lg:px-19.5 py-12">
					<div className="w-full max-w-xl">
						<PageError
							title="Unable to Load Session"
							description="We couldn't load this session. Please try again in a moment."
							detail={errorDetail}
							action={
								<div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
									<Link href={`/sessions/${id}`}>
										<Button
											variant="outline"
											size="sm"
											className="inline-flex w-full items-center justify-center gap-1.5 border-red-300 text-red-700 hover:bg-red-100 cursor-pointer sm:w-auto"
										>
											<RefreshCw className="size-3.5" aria-hidden="true" />
											Try Again
										</Button>
									</Link>
									<Link href="/sessions">
										<Button
											variant="outline"
											size="sm"
											className="inline-flex w-full items-center justify-center gap-1.5 border-red-300 bg-white text-red-700 hover:bg-red-50 cursor-pointer sm:w-auto"
										>
											<ChevronLeft className="size-3.5" aria-hidden="true" />
											Back to Sessions
										</Button>
									</Link>
								</div>
							}
						/>
					</div>
				</div>
			</>
		);
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
																						{/* ── Committee name row ── */}
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
																						{/* Sub-items */}
																						<div className="ml-16 sm:ml-20 space-y-1">
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

			<SessionDetailStyles />
		</>
	);
}
