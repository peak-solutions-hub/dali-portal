"use client";

import type {
	SessionManagementAgendaPanelProps as AgendaPanelProps,
	SessionManagementDocument as Document,
	SessionManagementSession as Session,
} from "@repo/shared";
import { formatSessionDate, formatSessionTime } from "@repo/shared";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import {
	CheckCircle2,
	ChevronDown,
	FileText,
	Loader2,
	Lock,
	Monitor,
	Save,
	Search,
	Send,
	Trash2,
	Undo2,
	Upload,
	X,
} from "@repo/ui/lib/lucide-react";
import {
	getSessionStatusBadgeClass,
	getSessionStatusLabel,
	getSessionTypeLabel,
} from "@repo/ui/lib/session-ui";
import { useRef, useState } from "react";
import { AgendaItemCard } from "./agenda-item-card";
import { DeleteSessionDialog } from "./delete-session-dialog";
import { MarkCompleteDialog } from "./mark-complete-dialog";
import { PublishSessionDialog } from "./publish-session-dialog";
import { SaveDraftDialog } from "./save-draft-dialog";
import { UnpublishSessionDialog } from "./unpublish-session-dialog";

export interface AttachedDocument {
	id: string;
	key: string;
	title: string;
	summary?: string;
	classification?: string;
}

export function AgendaPanel({
	sessions,
	selectedSession,
	agendaItems,
	onAddDocument,
	onSaveDraft,
	onPublish,
	onMarkComplete,
	onStartPresentation,
	onSessionChange,
	onUnpublish,
	onDeleteDraft,
	actionInFlight,
	contentTextMap,
	onContentTextChange,
	documentsByAgendaItem,
	onDocumentsByAgendaItemChange,
	onViewDocument,
}: AgendaPanelProps & {
	onStartPresentation?: () => void;
	sessions: Session[];
	onSessionChange: (sessionId: string) => void;
	onUnpublish?: () => void;
	onDeleteDraft?: () => void;
	actionInFlight?: string | null;
	contentTextMap?: Record<string, string>;
	onContentTextChange?: (itemId: string, text: string) => void;
	documentsByAgendaItem: Record<string, AttachedDocument[]>;
	onDocumentsByAgendaItemChange: (
		docs: Record<string, AttachedDocument[]>,
	) => void;
	onViewDocument?: (documentId: string) => void;
}) {
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showMarkCompleteDialog, setShowMarkCompleteDialog] = useState(false);
	const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
	const [showPublishDialog, setShowPublishDialog] = useState(false);
	const [showSessionDropdown, setShowSessionDropdown] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [agendaFile, setAgendaFile] = useState<File | null>(null);
	const agendaFileInputRef = useRef<HTMLInputElement>(null);

	const handleAddDocument = (agendaItemId: string) => {
		onAddDocument(agendaItemId);
	};

	const handleDropDocument = (agendaItemId: string, document: Document) => {
		// Prevent duplicate documents in the same section
		const existing = documentsByAgendaItem[agendaItemId] || [];
		if (existing.some((doc) => doc.id === document.id)) {
			return; // Already attached to this section
		}

		const attachedDoc: AttachedDocument = {
			id: document.id,
			key: document.number,
			title: document.title,
			classification: document.classification,
		};

		onDocumentsByAgendaItemChange({
			...documentsByAgendaItem,
			[agendaItemId]: [...existing, attachedDoc],
		});
	};

	const handleRemoveDocument = (agendaItemId: string, documentId: string) => {
		onDocumentsByAgendaItemChange({
			...documentsByAgendaItem,
			[agendaItemId]: (documentsByAgendaItem[agendaItemId] || []).filter(
				(doc) => doc.id !== documentId,
			),
		});
	};

	const handleUpdateDocumentSummary = (
		agendaItemId: string,
		documentId: string,
		summary: string,
	) => {
		onDocumentsByAgendaItemChange({
			...documentsByAgendaItem,
			[agendaItemId]: (documentsByAgendaItem[agendaItemId] || []).map((doc) =>
				doc.id === documentId ? { ...doc, summary } : doc,
			),
		});
	};

	const handleDragOver = (e: React.DragEvent, agendaItemId: string) => {
		e.preventDefault();
		e.currentTarget.classList.add("bg-blue-50", "border-blue-300");
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.currentTarget.classList.remove("bg-blue-50", "border-blue-300");
	};

	const handleDrop = (e: React.DragEvent, agendaItemId: string) => {
		e.preventDefault();
		e.currentTarget.classList.remove("bg-blue-50", "border-blue-300");

		const documentData = e.dataTransfer.getData("application/json");
		if (documentData) {
			const document: Document = JSON.parse(documentData);
			handleDropDocument(agendaItemId, document);
		}
	};

	const handleSelectSession = (sessionId: string) => {
		onSessionChange(sessionId);
		setShowSessionDropdown(false);
		setSearchQuery("");
		setTypeFilter("all");
		setStatusFilter("all");
	};

	const isScheduled = selectedSession?.status === "scheduled";
	const isCompleted = selectedSession?.status === "completed";
	const isDraft = selectedSession?.status === "draft";

	// Filter sessions based on type, status, and search query
	const filteredSessions = sessions.filter((session) => {
		if (typeFilter !== "all" && session.type !== typeFilter) return false;
		if (statusFilter !== "all" && session.status !== statusFilter) return false;

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			const sessionNum = session.sessionNumber.toString();
			const date = formatSessionDate(session.date).toLowerCase();
			const type = getSessionTypeLabel(session.type).toLowerCase();

			return (
				sessionNum.includes(query) ||
				date.includes(query) ||
				type.includes(query)
			);
		}

		return true;
	});

	// Group sessions by status
	const groupedSessions = {
		draft: filteredSessions.filter((s) => s.status === "draft"),
		scheduled: filteredSessions.filter((s) => s.status === "scheduled"),
		completed: filteredSessions.filter((s) => s.status === "completed"),
	};

	const hasActiveFilters =
		typeFilter !== "all" || statusFilter !== "all" || searchQuery;

	return (
		<div className="flex h-full w-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5">
			{/* Session Selector Dropdown */}
			<div className="border-b border-gray-200 pb-3">
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Current Session
				</label>
				<Popover
					open={showSessionDropdown}
					onOpenChange={setShowSessionDropdown}
				>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className="w-full justify-between px-4 py-6 h-auto border-2 hover:border-[#a60202] hover:bg-gray-50 transition-all cursor-pointer"
						>
							{selectedSession ? (
								<div className="flex-1 text-left">
									<div className="flex items-center gap-2">
										<span className="text-base font-semibold text-gray-900">
											Session #{selectedSession.sessionNumber}
										</span>
										<span
											className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getSessionStatusBadgeClass(selectedSession.status)} text-white`}
										>
											{getSessionStatusLabel(selectedSession.status)}
										</span>
									</div>
									<div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
										<span>{getSessionTypeLabel(selectedSession.type)}</span>
										<span>•</span>
										<span>{formatSessionDate(selectedSession.date)}</span>
										<span>•</span>
										<span>
											{formatSessionTime(
												`${selectedSession.date}T${selectedSession.time}`,
											)}
										</span>
									</div>
								</div>
							) : (
								<span className="text-gray-500">Select a session...</span>
							)}
							<ChevronDown
								className={`h-5 w-5 text-gray-400 transition-transform ${showSessionDropdown ? "rotate-180" : ""}`}
							/>
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className="p-0"
						align="start"
						style={{ width: "var(--radix-popover-trigger-width)" }}
					>
						<div className="flex flex-col w-full">
							{/* Search and Filters */}
							<div className="p-4 space-y-3 border-b border-gray-200 shrink-0 w-full">
								{/* Search */}
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
									<Input
										type="text"
										placeholder="Search sessions..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-9"
									/>
								</div>

								{/* Filters Row */}
								<div className="flex gap-2">
									<Select value={typeFilter} onValueChange={setTypeFilter}>
										<SelectTrigger className="flex-1 h-8 text-xs cursor-pointer">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Types</SelectItem>
											<SelectItem value="regular">Regular</SelectItem>
											<SelectItem value="special">Special</SelectItem>
										</SelectContent>
									</Select>
									<Select value={statusFilter} onValueChange={setStatusFilter}>
										<SelectTrigger className="flex-1 h-8 text-xs cursor-pointer">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Statuses</SelectItem>
											<SelectItem value="draft">Draft</SelectItem>
											<SelectItem value="scheduled">Scheduled</SelectItem>
											<SelectItem value="completed">Completed</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* Active Filters Summary - Always visible to prevent layout shift */}
								<div className="flex items-center justify-between text-xs min-h-5">
									{hasActiveFilters ? (
										<>
											<span className="text-gray-600">
												{filteredSessions.length} session
												{filteredSessions.length !== 1 ? "s" : ""} found
											</span>
											<button
												onClick={() => {
													setTypeFilter("all");
													setStatusFilter("all");
													setSearchQuery("");
												}}
												className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-[#a60202] hover:bg-red-100 font-medium transition-colors cursor-pointer"
											>
												<X className="h-3 w-3" />
												Clear filters
											</button>
										</>
									) : (
										<span className="text-gray-500">
											{sessions.length} session
											{sessions.length !== 1 ? "s" : ""} total
										</span>
									)}
								</div>
							</div>

							{/* Sessions List */}
							<div className="p-3 h-96 overflow-y-auto shrink-0 w-full">
								<div className="space-y-4">
									{/* Draft Sessions */}
									{groupedSessions.draft.length > 0 &&
										(statusFilter === "all" || statusFilter === "draft") && (
											<div>
												<div className="flex items-center gap-2 px-2 mb-2">
													<div className="h-2 w-2 rounded-full bg-gray-400"></div>
													<h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
														Draft ({groupedSessions.draft.length})
													</h3>
												</div>
												<div className="space-y-1">
													{groupedSessions.draft.map((session) => (
														<button
															key={session.id}
															onClick={() => handleSelectSession(session.id)}
															className={`w-full text-left px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
																selectedSession?.id === session.id
																	? "bg-red-50 border border-[#a60202]"
																	: "hover:bg-gray-50 border border-transparent"
															}`}
														>
															<div className="flex items-center gap-2 mb-1">
																<span className="text-sm font-semibold text-gray-900">
																	Session #{session.sessionNumber}
																</span>
																<span
																	className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${getSessionStatusBadgeClass(session.status)} text-white`}
																>
																	{getSessionStatusLabel(session.status)}
																</span>
															</div>
															<div className="flex items-center gap-1.5 text-xs text-gray-600">
																<span className="font-medium">
																	{getSessionTypeLabel(session.type)}
																</span>
																<span>•</span>
																<span>{formatSessionDate(session.date)}</span>
																{session.time && (
																	<>
																		<span>•</span>
																		<span>
																			{formatSessionTime(
																				`${session.date}T${session.time}`,
																			)}
																		</span>
																	</>
																)}
															</div>
														</button>
													))}
												</div>
											</div>
										)}

									{/* Scheduled Sessions */}
									{groupedSessions.scheduled.length > 0 &&
										(statusFilter === "all" ||
											statusFilter === "scheduled") && (
											<div>
												<div className="flex items-center gap-2 px-2 mb-2">
													<div className="h-2 w-2 rounded-full bg-blue-500"></div>
													<h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
														Scheduled ({groupedSessions.scheduled.length})
													</h3>
												</div>
												<div className="space-y-1">
													{groupedSessions.scheduled.map((session) => (
														<button
															key={session.id}
															onClick={() => handleSelectSession(session.id)}
															className={`w-full text-left px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
																selectedSession?.id === session.id
																	? "bg-red-50 border border-[#a60202]"
																	: "hover:bg-gray-50 border border-transparent"
															}`}
														>
															<div className="flex items-center gap-2 mb-1">
																<span className="text-sm font-semibold text-gray-900">
																	Session #{session.sessionNumber}
																</span>
																<span
																	className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${getSessionStatusBadgeClass(session.status)} text-white`}
																>
																	{getSessionStatusLabel(session.status)}
																</span>
															</div>
															<div className="flex items-center gap-1.5 text-xs text-gray-600">
																<span className="font-medium">
																	{getSessionTypeLabel(session.type)}
																</span>
																<span>•</span>
																<span>{formatSessionDate(session.date)}</span>
																{session.time && (
																	<>
																		<span>•</span>
																		<span>
																			{formatSessionTime(
																				`${session.date}T${session.time}`,
																			)}
																		</span>
																	</>
																)}
															</div>
														</button>
													))}
												</div>
											</div>
										)}

									{/* Completed Sessions */}
									{groupedSessions.completed.length > 0 &&
										(statusFilter === "all" ||
											statusFilter === "completed") && (
											<div>
												<div className="flex items-center gap-2 px-2 mb-2">
													<div className="h-2 w-2 rounded-full bg-green-500"></div>
													<h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
														Completed ({groupedSessions.completed.length})
													</h3>
												</div>
												<div className="space-y-1">
													{groupedSessions.completed.map((session) => (
														<button
															key={session.id}
															onClick={() => handleSelectSession(session.id)}
															className={`w-full text-left px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
																selectedSession?.id === session.id
																	? "bg-red-50 border border-[#a60202]"
																	: "hover:bg-gray-50 border border-transparent"
															}`}
														>
															<div className="flex items-center gap-2 mb-1">
																<span className="text-sm font-semibold text-gray-900">
																	Session #{session.sessionNumber}
																</span>
																<span
																	className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${getSessionStatusBadgeClass(session.status)} text-white`}
																>
																	{getSessionStatusLabel(session.status)}
																</span>
															</div>
															<div className="flex items-center gap-1.5 text-xs text-gray-600">
																<span className="font-medium">
																	{getSessionTypeLabel(session.type)}
																</span>
																<span>•</span>
																<span>{formatSessionDate(session.date)}</span>
																{session.time && (
																	<>
																		<span>•</span>
																		<span>
																			{formatSessionTime(
																				`${session.date}T${session.time}`,
																			)}
																		</span>
																	</>
																)}
															</div>
														</button>
													))}
												</div>
											</div>
										)}

									{/* No Results */}
									{filteredSessions.length === 0 && (
										<div className="text-center py-8">
											<p className="text-sm text-gray-500 mb-3">
												No sessions found
											</p>
											<p className="text-xs text-gray-400 mb-4">
												Try adjusting your filters or search query
											</p>
										</div>
									)}
								</div>
							</div>
						</div>
					</PopoverContent>
				</Popover>
			</div>

			{selectedSession ? (
				<>
					{/* Presentation Buttons for Scheduled Sessions */}
					{isScheduled && onStartPresentation && (
						<div className="space-y-2.5 border-b border-gray-200 pb-3">
							{/* Agenda PDF Upload — prominent, above actions */}
							<div className="rounded-lg border border-blue-200 bg-blue-50/60 p-2.5">
								<label className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-1.5">
									<FileText className="h-4 w-4 text-blue-600" />
									Agenda PDF (Public)
								</label>
								<input
									ref={agendaFileInputRef}
									type="file"
									accept=".pdf"
									className="hidden"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) setAgendaFile(file);
									}}
								/>
								{agendaFile ? (
									<div className="flex items-center gap-2 p-2.5 bg-white border border-blue-200 rounded-lg">
										<FileText className="h-4 w-4 text-blue-600 shrink-0" />
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-blue-800 truncate">
												{agendaFile.name}
											</p>
											<p className="text-xs text-blue-600">
												{(agendaFile.size / 1024 / 1024).toFixed(2)} MB
											</p>
										</div>
										<Button
											variant="ghost"
											size="sm"
											className="cursor-pointer text-blue-600 hover:text-red-600 hover:bg-red-50"
											onClick={() => {
												setAgendaFile(null);
												if (agendaFileInputRef.current)
													agendaFileInputRef.current.value = "";
											}}
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								) : (
									<Button
										variant="outline"
										className="w-full cursor-pointer border-dashed border-blue-300 bg-white text-blue-700 hover:bg-blue-50 hover:border-blue-400"
										onClick={() => agendaFileInputRef.current?.click()}
									>
										<Upload className="h-4 w-4 mr-2" />
										Upload Agenda PDF
									</Button>
								)}
								<p className="text-xs text-blue-600/70 mt-1.5">
									This agenda will be publicly available for viewing.
								</p>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-2">
								<Button
									className="flex-1 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
									onClick={onStartPresentation}
									disabled={!!actionInFlight}
								>
									<Monitor className="h-4 w-4 mr-2" />
									View Presentation
								</Button>
								<Button
									className="flex-1 cursor-pointer bg-green-600 hover:bg-green-700 text-white"
									onClick={() => setShowMarkCompleteDialog(true)}
									disabled={!!actionInFlight}
								>
									{actionInFlight === "completing" ? (
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									) : (
										<CheckCircle2 className="h-4 w-4 mr-2" />
									)}
									{actionInFlight === "completing"
										? "Completing..."
										: "Mark as Completed"}
								</Button>
							</div>
							<Button
								variant="outline"
								className="w-full cursor-pointer border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
								onClick={() => setShowUnpublishDialog(true)}
								disabled={!!actionInFlight}
							>
								{actionInFlight === "unpublishing" ? (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								) : (
									<Undo2 className="h-4 w-4 mr-2" />
								)}
								{actionInFlight === "unpublishing"
									? "Unpublishing..."
									: "Unpublish to Draft"}
							</Button>
						</div>
					)}
					{isCompleted && (
						<div className="flex items-center gap-2 p-3 bg-gray-100 border border-gray-200 rounded-lg">
							<Lock className="h-4 w-4 text-gray-500 shrink-0" />
							<p className="text-sm text-gray-600">
								This session is completed and locked from editing.
							</p>
						</div>
					)}

					{/* Agenda Items */}
					<div className="flex-1 overflow-y-auto min-h-0">
						<div className="flex flex-col gap-3">
							{agendaItems.map((item) => (
								<div
									key={item.id}
									onDragOver={(e) => isDraft && handleDragOver(e, item.id)}
									onDragLeave={isDraft ? handleDragLeave : undefined}
									onDrop={(e) => isDraft && handleDrop(e, item.id)}
									className={`transition-colors rounded-lg ${isCompleted ? "opacity-75" : ""}`}
								>
									<AgendaItemCard
										item={item}
										documents={documentsByAgendaItem[item.id]}
										sessions={sessions}
										selectedSessionId={selectedSession?.id}
										contentText={contentTextMap?.[item.id]}
										onContentTextChange={
											isDraft ? onContentTextChange : undefined
										}
										onAddDocument={isDraft ? handleAddDocument : undefined}
										onRemoveDocument={
											isCompleted ? undefined : handleRemoveDocument
										}
										onUpdateDocumentSummary={
											isDraft ? handleUpdateDocumentSummary : undefined
										}
										onViewDocument={onViewDocument}
									/>
								</div>
							))}
						</div>
					</div>

					{/* Action Buttons - Only for Draft Sessions */}
					{!isScheduled && !isCompleted && (
						<div className="space-y-2 border-t border-gray-200 pt-3">
							<div className="flex gap-2">
								<Button
									className="flex-1 cursor-pointer bg-amber-500 text-white hover:bg-amber-600"
									onClick={() => setShowSaveDraftDialog(true)}
									disabled={!!actionInFlight}
								>
									{actionInFlight === "saving" ? (
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									) : (
										<Save className="h-4 w-4 mr-2" />
									)}
									{actionInFlight === "saving" ? "Saving..." : "Save as Draft"}
								</Button>
								<Button
									className="flex-1 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
									onClick={() => setShowPublishDialog(true)}
									disabled={!!actionInFlight}
								>
									{actionInFlight === "publishing" ? (
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									) : (
										<Send className="h-4 w-4 mr-2" />
									)}
									{actionInFlight === "publishing"
										? "Publishing..."
										: "Finalize & Publish"}
								</Button>
							</div>
							<Button
								variant="outline"
								className="w-full cursor-pointer border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
								onClick={() => setShowDeleteDialog(true)}
								disabled={!!actionInFlight}
							>
								{actionInFlight === "deleting" ? (
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								) : (
									<Trash2 className="h-4 w-4 mr-2" />
								)}
								{actionInFlight === "deleting" ? "Deleting..." : "Delete Draft"}
							</Button>
						</div>
					)}
				</>
			) : (
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<p className="text-base text-gray-500 mb-4">No session selected</p>
						<Button
							onClick={() => setShowSessionDropdown(true)}
							className="bg-[#a60202] hover:bg-[#8b0000] text-white cursor-pointer"
						>
							Select a Session
						</Button>
					</div>
				</div>
			)}

			{/* Mark Complete Dialog */}
			{selectedSession && (
				<MarkCompleteDialog
					open={showMarkCompleteDialog}
					onOpenChange={setShowMarkCompleteDialog}
					sessionNumber={selectedSession.sessionNumber.toString()}
					sessionType={getSessionTypeLabel(selectedSession.type)}
					sessionDate={formatSessionDate(selectedSession.date)}
					onConfirm={onMarkComplete}
				/>
			)}

			{/* Unpublish Dialog */}
			{selectedSession && (
				<UnpublishSessionDialog
					open={showUnpublishDialog}
					onOpenChange={setShowUnpublishDialog}
					sessionId={selectedSession.id}
					sessionNumber={selectedSession.sessionNumber.toString()}
					onUnpublished={onUnpublish}
				/>
			)}

			{/* Delete Draft Dialog */}
			{selectedSession && (
				<DeleteSessionDialog
					open={showDeleteDialog}
					onOpenChange={setShowDeleteDialog}
					sessionId={selectedSession.id}
					sessionNumber={selectedSession.sessionNumber.toString()}
					onDeleted={onDeleteDraft}
				/>
			)}

			{/* Save Draft Dialog */}
			{selectedSession && (
				<SaveDraftDialog
					open={showSaveDraftDialog}
					onOpenChange={setShowSaveDraftDialog}
					sessionNumber={selectedSession.sessionNumber.toString()}
					onConfirm={onSaveDraft}
				/>
			)}

			{/* Publish Session Dialog */}
			{selectedSession && (
				<PublishSessionDialog
					open={showPublishDialog}
					onOpenChange={setShowPublishDialog}
					sessionNumber={selectedSession.sessionNumber.toString()}
					onConfirm={onPublish}
				/>
			)}
		</div>
	);
}
