"use client";

import type { SessionWithAgenda } from "@repo/shared";
import { FileText, Globe, Monitor } from "@repo/ui/lib/lucide-react";
import { type ReactNode, useState } from "react";
import { SessionPdfView } from "./session-pdf-view";
import { SessionPresentationView } from "./session-presentation-view";

type ViewMode = "web" | "presentation" | "pdf";

interface SessionViewSwitcherProps {
	session: SessionWithAgenda;
	agendaFilePath: string | null;
	children: ReactNode;
}

export function SessionViewSwitcher({
	session,
	agendaFilePath,
	children,
}: SessionViewSwitcherProps) {
	const [activeView, setActiveView] = useState<ViewMode>("web");

	const viewButtons: {
		mode: ViewMode;
		label: string;
		shortLabel: string;
		icon: typeof Monitor;
		disabled?: boolean;
		tooltip?: string;
	}[] = [
		{
			mode: "presentation",
			label: "Presentation View",
			shortLabel: "Slides",
			icon: Monitor,
		},
		{
			mode: "web",
			label: "Web View",
			shortLabel: "Web",
			icon: Globe,
		},
		{
			mode: "pdf",
			label: "PDF View",
			shortLabel: "PDF",
			icon: FileText,
			disabled: !agendaFilePath,
			tooltip: !agendaFilePath
				? "No PDF uploaded for this session."
				: undefined,
		},
	];

	return (
		<div>
			{/* Header row: Agenda title left, view buttons right */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
				<h2 className="font-serif text-xl sm:text-2xl text-primary">
					Session Agenda
				</h2>
				<div className="flex gap-1.5 sm:gap-2">
					{viewButtons.map(
						({ mode, label, shortLabel, icon: Icon, disabled, tooltip }) => {
							const isActive = activeView === mode;
							return (
								<button
									key={mode}
									onClick={() => !disabled && setActiveView(mode)}
									disabled={disabled}
									title={tooltip}
									className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
										isActive
											? "bg-[#a60202] text-white shadow-sm"
											: disabled
												? "border border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
												: mode === "presentation"
													? "border-2 border-[#ffc107] text-[#a60202] hover:bg-yellow-50"
													: "border border-[#a60202] text-[#a60202] hover:bg-red-50"
									}`}
								>
									<Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
									<span className="hidden sm:inline whitespace-nowrap">
										{label}
									</span>
									<span className="sm:hidden whitespace-nowrap">
										{shortLabel}
									</span>
								</button>
							);
						},
					)}
				</div>
			</div>

			{/* View Content */}
			{activeView === "web" && children}
			{activeView === "presentation" && (
				<SessionPresentationView
					session={session}
					onExitPresentation={() => setActiveView("web")}
				/>
			)}
			{activeView === "pdf" && agendaFilePath && (
				<SessionPdfView agendaFilePath={agendaFilePath} />
			)}
		</div>
	);
}
