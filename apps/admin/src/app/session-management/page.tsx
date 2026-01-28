"use client";

import { Button } from "@repo/ui/components/button";
import { Plus } from "@repo/ui/lib/lucide-react";
import { useState } from "react";
import {
	AgendaPanel,
	CreateSessionDialog,
	DocumentsPanel,
	PresentationMode,
	PublishSessionDialog,
} from "@/components/session-management";
import { MOCK_DOCUMENTS, MOCK_SESSIONS } from "@/lib/mock-data";

// Pre-defined agenda items matching Figma design
const DEFAULT_AGENDA_ITEMS = [
	{ id: "1", title: "01. Intro" },
	{ id: "2", title: "02. Opening Prayer/Invocation" },
	{ id: "3", title: "03. National Anthem and Pledge of Allegiance" },
	{ id: "4", title: "04. Roll Call" },
	{ id: "5", title: "05. Reading and/or approval of the Minutes" },
	{ id: "6", title: "06. First Reading and References" },
	{ id: "7", title: "07. Committee Report" },
	{ id: "8", title: "08. Calendar of Business" },
	{ id: "9", title: "09. Third Reading" },
	{ id: "10", title: "10. Other Matters" },
	{ id: "11", title: "11. Closing Prayer" },
	{ id: "12", title: "12. Adjournment" },
];

export default function SessionManagement() {
	return <AgendaBuilderPage />;
}

function AgendaBuilderPage() {
	const [sessions] = useState(MOCK_SESSIONS);
	const [selectedSession, setSelectedSession] = useState<string | null>(null);
	const [availableDocuments] = useState(MOCK_DOCUMENTS);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [showPublishDialog, setShowPublishDialog] = useState(false);
	const [showPresentationMode, setShowPresentationMode] = useState(false);

	const handleSessionChange = (sessionId: string) => {
		setSelectedSession(sessionId);
	};

	const handleAddDocument = (agendaItemId: string) => {
		// Handled by AgendaPanel's Jira picker
		console.log("Add document to agenda item:", agendaItemId);
	};

	const handleSaveDraft = () => {
		// TODO: Save draft to backend
		console.log("Save draft");
	};

	const handlePublish = () => {
		setShowPublishDialog(true);
	};

	const handleStartPresentation = () => {
		setShowPresentationMode(true);
	};

	const selectedSessionData = sessions.find((s) => s.id === selectedSession);

	if (showPresentationMode && selectedSessionData) {
		return (
			<PresentationMode
				sessionNumber={selectedSessionData.sessionNumber.toString()}
				sessionType={selectedSessionData.type}
				sessionDate={selectedSessionData.date}
				sessionTime={selectedSessionData.time}
				agendaItems={DEFAULT_AGENDA_ITEMS.map((item) => ({
					id: item.id,
					title: item.title,
					documents: [],
				}))}
				onExit={() => setShowPresentationMode(false)}
			/>
		);
	}

	return (
		<div className="h-full bg-gray-50 overflow-hidden border-b border-[#e5e7eb] px-6 py-4">
			<div className="container mx-auto max-w-360 h-full flex flex-col">
				{/* Header with Create Button */}
				<div className="mb-2 flex items-center justify-between">
					<div />
					<Button
						onClick={() => setShowCreateDialog(true)}
						className="cursor-pointer"
					>
						<Plus className="h-4 w-4 mr-2" />
						Create New Session
					</Button>
				</div>

				{/* Two Column Layout */}
				<div className="flex gap-4 flex-1 overflow-hidden">
					{/* Left Panel - Documents (454px) */}
					<div className="w-113.5 shrink-0 overflow-y-auto">
						<DocumentsPanel documents={availableDocuments} />
					</div>

					{/* Right Panel - Agenda */}
					<div className="flex-1 overflow-y-auto">
						<AgendaPanel
							sessions={sessions}
							selectedSession={selectedSessionData || null}
							agendaItems={DEFAULT_AGENDA_ITEMS}
							onAddDocument={handleAddDocument}
							onSaveDraft={handleSaveDraft}
							onPublish={handlePublish}
							onStartPresentation={handleStartPresentation}
							onSessionChange={handleSessionChange}
						/>
					</div>
				</div>

				{/* Dialogs */}
				<CreateSessionDialog
					open={showCreateDialog}
					onOpenChange={setShowCreateDialog}
					onSessionCreated={(id) => {
						handleSessionChange(id);
					}}
				/>
				<PublishSessionDialog
					open={showPublishDialog}
					onOpenChange={setShowPublishDialog}
					sessionId={selectedSession || ""}
					agendaItemCount={DEFAULT_AGENDA_ITEMS.length}
					onPublished={() => {
						alert("Session published successfully!");
					}}
				/>
			</div>
		</div>
	);
}
