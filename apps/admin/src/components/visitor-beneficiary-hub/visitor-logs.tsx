"use client";

import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { Download, FileText, Plus } from "lucide-react";
import { useState } from "react";

// Mock data based on Figma design
export const MOCK_VISITOR_LOGS = [
	{
		id: "1",
		dateVisited: "2025-10-10T09:30:00",
		constituentName: "Maria Santos",
		purpose: "Assistance Request",
		affiliation: null,
		remarks: "Requesting financial assistance for medical expenses",
		loggedBy: "Ruth",
	},
	{
		id: "2",
		dateVisited: "2025-10-12T11:00:00",
		constituentName: "Rosa Fernandez",
		purpose: "Document Submission",
		affiliation: null,
		remarks: "Submitted requirements for burial assistance",
		loggedBy: "Secretariat Staff",
	},
	{
		id: "3",
		dateVisited: "2025-10-13T14:15:00",
		constituentName: "Antonio Cruz",
		purpose: "Inquiry",
		affiliation: null,
		remarks: "Inquired about senior citizen benefits",
		loggedBy: "Ruth",
	},
	{
		id: "4",
		dateVisited: "2025-10-14T10:00:00",
		constituentName: "Miguel Reyes",
		purpose: "Consultation",
		affiliation: "Iloilo Youth Council",
		remarks: "Consultation regarding youth programs",
		loggedBy: "Ruth",
	},
	{
		id: "5",
		dateVisited: "2025-10-15T13:45:00",
		constituentName: "Juan Dela Cruz",
		purpose: "Assistance Request",
		affiliation: null,
		remarks: "Walk-in for medical assistance - scheduled for follow-up",
		loggedBy: "Secretariat Staff",
	},
	{
		id: "6",
		dateVisited: "2025-10-16T15:30:00",
		constituentName: "Pedro Santos",
		purpose: "Other",
		affiliation: "Barangay Molo",
		remarks: "Follow-up on previous assistance application",
		loggedBy: "Ruth",
	},
	{
		id: "7",
		dateVisited: "2025-09-28T09:00:00",
		constituentName: "Elena Garcia",
		purpose: "Inquiry",
		affiliation: null,
		remarks: "Asked about housing assistance programs",
		loggedBy: "Secretariat Staff",
	},
];

function formatDateTime(isoString: string): string {
	const date = new Date(isoString);
	return date.toLocaleString("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		second: "2-digit",
		hour12: true,
	});
}

const INITIAL_VISITOR_FORM_STATE = {
	familyName: "",
	firstName: "",
	affiliation: "",
	purpose: "",
};

export function VisitorLogs() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [formState, setFormState] = useState(INITIAL_VISITOR_FORM_STATE);

	const handleInputChange = (field: keyof typeof formState, value: string) => {
		setFormState((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		// This submission handler just closes the dialog for now.
		setFormState(INITIAL_VISITOR_FORM_STATE);
		setIsDialogOpen(false);
	};

	const totalVisits = MOCK_VISITOR_LOGS.length;

	return (
		<div className="space-y-6">
			{/* Stats Card */}
			<Card className="w-fit px-6 py-4 border border-gray-200 shadow-sm">
				<div className="flex items-center gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
						<FileText className="h-6 w-6 text-emerald-600" />
					</div>
					<div>
						<p className="text-sm text-gray-500">Total Visits</p>
						<p className="text-2xl font-semibold text-gray-900">
							{totalVisits}
						</p>
					</div>
				</div>
			</Card>

			{/* Helper Text and Actions */}
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<p className="text-sm text-gray-500">
					To log a new visit, find the constituent in the "Beneficiary Database"
					tab and click "Log Visit" on their profile.
				</p>
				<div className="flex flex-wrap gap-3 justify-end">
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<Button onClick={() => setIsDialogOpen(true)} className="gap-2">
							<Plus className="h-4 w-4" />
							Add Visitor
						</Button>
						<DialogContent className="sm:max-w-2xl">
							<DialogHeader>
								<DialogTitle>Log Visitor</DialogTitle>
								<DialogDescription>
									Fill in the visitor details to add them to the log.
								</DialogDescription>
							</DialogHeader>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<label className="text-sm font-medium text-gray-700">
											Family Name
										</label>
										<Input
											value={formState.familyName}
											onChange={(e) =>
												handleInputChange("familyName", e.target.value)
											}
											placeholder="Enter family name"
											required
										/>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-700">
											First Name
										</label>
										<Input
											value={formState.firstName}
											onChange={(e) =>
												handleInputChange("firstName", e.target.value)
											}
											placeholder="Enter first name"
											required
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div>
										<label className="text-sm font-medium text-gray-700">
											Affiliation / Barangay
										</label>
										<Input
											value={formState.affiliation}
											onChange={(e) =>
												handleInputChange("affiliation", e.target.value)
											}
											placeholder="e.g. Barangay Molo"
										/>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-700">
											Purpose of Visit
										</label>
										<Input
											value={formState.purpose}
											onChange={(e) =>
												handleInputChange("purpose", e.target.value)
											}
											placeholder="e.g. Assistance request"
											required
										/>
									</div>
								</div>
								<DialogFooter>
									<Button
										type="button"
										variant="ghost"
										onClick={() => setIsDialogOpen(false)}
									>
										Cancel
									</Button>
									<Button type="submit">Save Visitor</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
					<Button variant="outline" className="gap-2">
						<Download className="h-4 w-4" />
						Export Visitor Logs
					</Button>
				</div>
			</div>

			{/* Visitor Logs Table */}
			<div className="rounded-lg border border-gray-200 overflow-hidden">
				<Table>
					<TableHeader className="bg-gray-50">
						<TableRow className="border-b border-gray-200 hover:bg-gray-50">
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-48">
								Date/Time
							</TableHead>
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-40">
								Constituent
							</TableHead>
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-40">
								Purpose
							</TableHead>
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-40">
								Affiliation
							</TableHead>
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 min-w-64">
								Remarks
							</TableHead>
							<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-36">
								Logged By
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{MOCK_VISITOR_LOGS.map((log, index) => (
							<TableRow
								key={log.id}
								className={`border-b border-gray-200 hover:bg-gray-50/50 ${
									index % 2 === 1 ? "bg-gray-50/30" : "bg-white"
								}`}
							>
								<TableCell className="px-6 py-4 text-sm text-gray-900">
									{formatDateTime(log.dateVisited)}
								</TableCell>
								<TableCell className="px-6 py-4 text-sm font-medium text-gray-900">
									{log.constituentName}
								</TableCell>
								<TableCell className="px-6 py-4 text-sm text-gray-900">
									{log.purpose}
								</TableCell>
								<TableCell className="px-6 py-4 text-sm text-gray-500">
									{log.affiliation ?? "-"}
								</TableCell>
								<TableCell className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
									{log.remarks}
								</TableCell>
								<TableCell className="px-6 py-4 text-sm text-gray-900">
									{log.loggedBy}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
