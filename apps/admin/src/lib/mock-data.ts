import type { AgendaItem, Document, Session } from "@/types/session-management";

export const MOCK_SESSIONS: Session[] = [
	{
		id: "session-1",
		sessionNumber: 19,
		date: "2026-01-15",
		time: "10:00",
		type: "regular",
		status: "draft",
	},
	{
		id: "session-2",
		sessionNumber: 20,
		date: "2026-01-22",
		time: "14:00",
		type: "special",
		status: "scheduled",
	},
	{
		id: "session-3",
		sessionNumber: 18,
		date: "2026-01-08",
		time: "10:00",
		type: "regular",
		status: "completed",
	},
	{
		id: "session-4",
		sessionNumber: 21,
		date: "2026-01-29",
		time: "14:00",
		type: "regular",
		status: "scheduled",
	},
];

export const MOCK_DOCUMENTS: Document[] = [
	{
		id: "doc-1",
		title: "Budget Appropriation for Education Programs",
		type: "Ordinance",
		number: "ORD-2026-001",
	},
	{
		id: "doc-2",
		title: "Resolution Supporting Infrastructure Development",
		type: "Resolution",
		number: "RES-2026-015",
	},
	{
		id: "doc-3",
		title: "Community Health Services Enhancement Act",
		type: "Ordinance",
		number: "ORD-2026-002",
	},
	{
		id: "doc-4",
		title: "Traffic Management Implementation Plan",
		type: "Resolution",
		number: "RES-2026-016",
	},
	{
		id: "doc-5",
		title: "Environmental Protection Guidelines",
		type: "Ordinance",
		number: "ORD-2026-003",
	},
	{
		id: "doc-6",
		title: "Youth Development Program Approval",
		type: "Resolution",
		number: "RES-2026-017",
	},
];

export const MOCK_AGENDA_ITEMS: Record<string, AgendaItem[]> = {
	"session-1": [
		{
			id: "item-1",
			title: "Call to Order",
			description: "Opening of the session",
		},
		{
			id: "item-2",
			title: "Budget Appropriation for Education Programs",
			documentId: "doc-1",
			description: "First reading",
		},
		{
			id: "item-3",
			title: "Resolution Supporting Infrastructure Development",
			documentId: "doc-2",
		},
	],
	"session-2": [
		{
			id: "item-4",
			title: "Call to Order",
		},
		{
			id: "item-5",
			title: "Community Health Services Enhancement Act",
			documentId: "doc-3",
			description: "Second reading and approval",
		},
	],
	"session-3": [],
	"session-4": [
		{
			id: "item-6",
			title: "01. Intro",
			description: "Welcome and introductions",
		},
		{
			id: "item-7",
			title: "02. Opening Prayer/Invocation",
			description: "Invocation by council chaplain",
		},
		{
			id: "item-8",
			title: "03. National Anthem",
			description: "Philippine National Anthem",
		},
		{
			id: "item-9",
			title: "04. Budget Appropriation for Education Programs",
			documentId: "doc-1",
			description: "First reading and discussion",
		},
		{
			id: "item-10",
			title: "05. Resolution Supporting Infrastructure Development",
			documentId: "doc-2",
			description: "Approval and voting",
		},
		{
			id: "item-11",
			title: "06. Adjournment",
			description: "Closing remarks",
		},
	],
};
