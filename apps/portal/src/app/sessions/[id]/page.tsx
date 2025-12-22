import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { ChevronLeft } from "@repo/ui/lib/lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface AgendaItem {
	number: string;
	title: string;
	description?: string;
	documents?: {
		id: string;
		title: string;
	}[];
}

interface SessionData {
	id: string;
	type: string;
	status: string;
	date: string;
	time: string;
	sessionNumber: string;
	agendaItems: AgendaItem[];
}

// Mock data - replace with actual data fetching
const getSessionData = (id: string): SessionData | null => {
	// Validate session exists - in production, query database
	// For now, only accept session ID "1" as valid
	if (id !== "1") {
		return null;
	}

	return {
		id,
		type: "Regular Session",
		status: "Completed",
		date: "Wednesday, September 17, 2025",
		time: "10:00 AM",
		sessionNumber: "120",
		agendaItems: [
			{
				number: "01",
				title: "INTRO",
				description: "Session No. 120 | Regular Session | 9/17/2025",
			},
			{
				number: "02",
				title: "OPENING PRAYER/INVOCATION",
			},
			{
				number: "03",
				title: "NATIONAL ANTHEM AND PLEDGE OF ALLEGIANCE",
			},
			{
				number: "04",
				title: "ROLL CALL",
				description: "All members present",
			},
			{
				number: "05",
				title: "READING AND/OR APPROVAL OF THE MINUTES",
			},
			{
				number: "06",
				title: "AGENDA",
			},
			{
				number: "07",
				title: "FIRST READING AND REFERENCES",
				documents: [
					{
						id: "1",
						title:
							"An Ordinance Establishing a Smoke-Free Zone in All Public Markets and Commercial Centers",
					},
				],
			},
			{
				number: "08",
				title: "COMMITTEE REPORT",
			},
			{
				number: "09",
				title: "CALENDAR OF BUSINESS",
			},
			{
				number: "10",
				title: "THIRD READING",
				documents: [
					{
						id: "2",
						title:
							"An Ordinance Regulating the Operation of Karaoke and Videoke Establishments",
					},
				],
			},
			{
				number: "11",
				title: "OTHER MATTERS",
			},
			{
				number: "12",
				title: "CLOSING PRAYER",
			},
			{
				number: "13",
				title: "ADJOURNMENT",
				description: "Session adjourned",
			},
		],
	};
};

export default async function SessionDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const session = getSessionData(id);

	// Generic error - prevents enumeration of valid session IDs
	if (!session) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto max-w-7xl px-4 py-10">
				{/* Back Button */}
				<Link href="/sessions" className="mb-8 inline-block">
					<Button variant="outline" size="sm">
						<ChevronLeft className="size-4" />
						Back to Sessions
					</Button>
				</Link>

				{/* Main Card */}
				<div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
					{/* Session Header */}
					<div className="mb-12 space-y-4">
						{/* Badges */}
						<div className="flex gap-3">
							<Badge variant="default" className="bg-primary text-white">
								{session.type}
							</Badge>
							<Badge variant="outline">{session.status}</Badge>
						</div>

						{/* Date */}
						<h1 className="font-serif text-3xl font-normal text-primary">
							{session.date}
						</h1>

						{/* Time - WCAG AA compliant contrast */}
						<div className="flex items-center gap-2">
							<span className="text-lg font-medium text-gray-900">Time:</span>
							<time className="text-lg text-gray-900">{session.time}</time>
						</div>

						{/* Download removed as per latest requirements */}
					</div>

					{/* Session Agenda */}
					<div className="border-t border-gray-200 pt-8">
						<h2 className="mb-6 font-serif text-2xl text-primary">
							Session Agenda
						</h2>

						<div className="space-y-6">
							{session.agendaItems.map((item) => (
								<div
									key={item.number}
									className="border-l-4 border-primary pl-7 py-2"
								>
									<h3 className="text-base font-semibold text-primary">
										{item.number}. {item.title}
									</h3>
									{item.description && (
										<p className="mt-3 text-base text-gray-600">
											{item.description}
										</p>
									)}
									{item.documents && item.documents.length > 0 && (
										<ul className="mt-3 space-y-2">
											{item.documents.map((doc) => (
												<li key={doc.id} className="flex items-start">
													<span className="mr-2 text-primary">•</span>
													{/* not final, subject to changes --- will connect to michaels job */}
													<Link
														href={`/sessions/${session.id}/documents/${doc.id}`}
														className="text-base text-primary hover:underline"
													>
														{doc.title}
													</Link>
												</li>
											))}
										</ul>
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
