"use client";

import { Button } from "@repo/ui/components/button";
import { ChevronDown, Play } from "@repo/ui/lib/lucide-react";
import {
	getSessionStatusBadgeClass,
	getSessionStatusLabel,
	getSessionTypeLabel,
} from "@repo/ui/lib/session-ui";
import { useState } from "react";
import type {
	AgendaPanelProps,
	Document,
	Session,
} from "@/types/session-management";
import { AgendaItemCard } from "./agenda-item-card";

interface AttachedDocument {
	id: string;
	key: string;
	title: string;
}

export function AgendaPanel({
	sessions,
	selectedSession,
	agendaItems,
	onAddDocument,
	onSaveDraft,
	onPublish,
	onStartPresentation,
	onSessionChange,
}: AgendaPanelProps & {
	onStartPresentation?: () => void;
	sessions: Session[];
	onSessionChange: (sessionId: string) => void;
}) {
	const [documentsByAgendaItem, setDocumentsByAgendaItem] = useState<
		Record<string, AttachedDocument[]>
	>({});

	// Use shared status badge class for consistency across UI
	// statusClasses combine background and text color if needed
	// (fallback to a neutral style if one is not defined)
	// NOTE: `getSessionStatusBadgeClass` returns only background color class
	// we append `text-white` here to match existing visual style for badges.
	// Draft/other states can be styled differently in the future if needed.

	const handleAddDocument = (agendaItemId: string) => {
		// This will be called when a document is dropped on an agenda item
		onAddDocument(agendaItemId);
	};

	const handleDropDocument = (agendaItemId: string, document: Document) => {
		const attachedDoc: AttachedDocument = {
			id: document.id,
			key: document.number,
			title: document.title,
		};

		setDocumentsByAgendaItem((prev) => ({
			...prev,
			[agendaItemId]: [...(prev[agendaItemId] || []), attachedDoc],
		}));
	};

	const handleRemoveDocument = (agendaItemId: string, documentId: string) => {
		setDocumentsByAgendaItem((prev) => ({
			...prev,
			[agendaItemId]: (prev[agendaItemId] || []).filter(
				(doc) => doc.id !== documentId,
			),
		}));
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

	const isScheduled = selectedSession?.status === "scheduled";

	return (
		<div className="flex h-full w-full flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6">
			{/* Session Selector Dropdown */}
			<div className="flex flex-col gap-2 border-b border-gray-200 pb-4">
				<label className="text-lg font-semibold text-gray-900">
					Select Session
				</label>
				<div className="relative">
					<select
						value={selectedSession?.id || ""}
						onChange={(e) => onSessionChange(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#a60202] focus:border-[#a60202] appearance-none cursor-pointer"
					>
						<option value="">Choose a session...</option>
						{sessions.map((session) => {
							const date = new Date(session.date);
							const formattedDate = date.toLocaleDateString("en-US", {
								year: "numeric",
								month: "2-digit",
								day: "2-digit",
							});
							return (
								<option key={session.id} value={session.id}>
									Session #{session.sessionNumber} -{" "}
									{getSessionTypeLabel(session.type)} - {formattedDate} (
									{getSessionStatusLabel(session.status)})
								</option>
							);
						})}
					</select>
					<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
				</div>
			</div>

			{selectedSession ? (
				<>
					{/* Session Info Banner */}
					<div className="flex flex-col gap-0 border-b border-gray-200 pb-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-base font-semibold text-gray-900 leading-6">
									Session #{selectedSession.sessionNumber}
								</h3>
								<p className="text-sm text-gray-600 leading-5">
									{selectedSession.time} •{" "}
									{getSessionTypeLabel(selectedSession.type)}
								</p>
							</div>
							<span
								className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getSessionStatusBadgeClass(selectedSession.status)} text-white`}
							>
								{getSessionStatusLabel(selectedSession.status)}
							</span>
						</div>

						{/* Presentation Button for Scheduled Sessions */}
						{isScheduled && onStartPresentation && (
							<div className="mt-4 flex gap-2">
								<Button
									variant="outline"
									className="flex-1 cursor-pointer"
									onClick={onStartPresentation}
								>
									<Play className="h-4 w-4 mr-2" />
									Start Presentation
								</Button>
								<Button variant="outline" className="flex-1 cursor-pointer">
									Mark as Completed
								</Button>
							</div>
						)}
					</div>

					{/* Agenda Items */}
					<div className="flex-1 overflow-y-auto">
						<div className="flex flex-col gap-4">
							{agendaItems.map((item) => (
								<div
									key={item.id}
									onDragOver={(e) => handleDragOver(e, item.id)}
									onDragLeave={handleDragLeave}
									onDrop={(e) => handleDrop(e, item.id)}
									className="transition-colors rounded-lg"
								>
									<AgendaItemCard
										item={item}
										documents={documentsByAgendaItem[item.id]}
										onAddDocument={handleAddDocument}
										onRemoveDocument={handleRemoveDocument}
									/>
								</div>
							))}
						</div>
					</div>

					{/* Action Buttons - Only for Draft Sessions */}
					{!isScheduled && (
						<div className="flex gap-2 border-t border-gray-200 pt-4">
							<Button
								variant="outline"
								className="flex-1 cursor-pointer"
								onClick={onSaveDraft}
							>
								Save as Draft
							</Button>
							<Button
								className="flex-1 bg-[#dc2626] hover:bg-[#b91c1c] text-white cursor-pointer"
								onClick={onPublish}
							>
								Finalize & Publish
							</Button>
						</div>
					)}
				</>
			) : (
				<div className="flex-1 flex items-center justify-center">
					<p className="text-base text-gray-500 text-center">
						Select a session to edit or create a new one
					</p>
				</div>
			)}
		</div>
	);
}
