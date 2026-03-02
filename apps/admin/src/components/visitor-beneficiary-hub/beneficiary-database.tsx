"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { Textarea } from "@repo/ui/components/textarea";
import { endOfDay, format, startOfDay } from "date-fns";
import {
	ArrowUpDown,
	ClipboardList,
	FileText,
	Filter,
	MapPin,
	PenLine,
	Plus,
	Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DatePickerField } from "./date-picker-field";
import { MOCK_VISITOR_LOGS } from "./visitor-logs";

const INITIAL_BENEFICIARY_FORM_STATE = {
	familyName: "",
	firstName: "",
	middleName: "",
	municipality: "",
	barangay: "",
	sex: "",
	civilStatus: "",
	age: "",
	phoneNumber: "",
	email: "",
	purpose: "",
};

const ILOILO_LOCALITIES = [
	"Ajuy",
	"Alimodian",
	"Anilao",
	"Badiangan",
	"Balasan",
	"Banate",
	"Barotac Nuevo",
	"Barotac Viejo",
	"Batad",
	"Bingawan",
	"Cabatuan",
	"Calinog",
	"Carles",
	"Concepcion",
	"Dingle",
	"Dueñas",
	"Dumangas",
	"Estancia",
	"Guimbal",
	"Igbaras",
	"Janiuay",
	"Lambunao",
	"Leganes",
	"Lemery",
	"Leon",
	"Maasin",
	"Miagao",
	"Mina",
	"New Lucena",
	"Oton",
	"Pavia",
	"Pototan",
	"San Dionisio",
	"San Enrique",
	"San Joaquin",
	"San Miguel",
	"San Rafael",
	"Santa Barbara",
	"Sara",
	"Tigbauan",
	"Tubungan",
	"Zarraga",
];

const SEX_OPTIONS = [
	{ label: "Male", value: "male" },
	{ label: "Female", value: "female" },
	{ label: "Prefer not to say", value: "prefer_not_to_say" },
];

const CIVIL_STATUS_OPTIONS = [
	{ label: "Single", value: "single" },
	{ label: "Married", value: "married" },
	{ label: "Widowed", value: "widowed" },
	{ label: "Separated", value: "separated" },
];

const ASSISTANCE_TYPES = [
	"Medicine Assistance",
	"Burial Assistance",
	"Hospital Bill Assistance",
	"Laboratory Fees Assistance",
	"Scholarship Grant",
];

const BENEFICIARY_SOURCE_LOGS = MOCK_VISITOR_LOGS.filter(
	(log) =>
		log.purpose.toLowerCase().includes("assistance") ||
		log.remarks.toLowerCase().includes("assistance"),
);

function formatNameDisplay(fullName: string): string {
	const parts = fullName.trim().split(/\s+/);
	if (parts.length <= 1) return fullName;
	const lastName = parts[parts.length - 1];
	const firstNames = parts.slice(0, -1).join(" ");
	return `${lastName}, ${firstNames}`;
}

type VisitEntry = {
	id: string;
	date: string;
	title: string;
	assistanceType: string;
	notes?: string;
};

type BeneficiaryRecord = {
	id: string;
	name: string;
	municipality: string;
	barangay: string;
	sex: string;
	civilStatus: string;
	age: string;
	phoneNumber: string;
	email: string;
	purpose: string;
	createdAt: string;
	visits: VisitEntry[];
};

type VisitEditorState = {
	beneficiaryId: string;
	visit: VisitEntry;
};

const MOCK_BENEFICIARIES: BeneficiaryRecord[] = BENEFICIARY_SOURCE_LOGS.map(
	(log, index) => {
		const sexOption =
			SEX_OPTIONS[index % SEX_OPTIONS.length] ?? SEX_OPTIONS[0] ?? undefined;
		const civilStatusOption =
			CIVIL_STATUS_OPTIONS[index % CIVIL_STATUS_OPTIONS.length] ??
			CIVIL_STATUS_OPTIONS[0] ??
			undefined;
		const assistanceType =
			ASSISTANCE_TYPES[index % ASSISTANCE_TYPES.length] ??
			ASSISTANCE_TYPES[0] ??
			"Assistance Request";

		return {
			id: `${log.id}-beneficiary`,
			name: log.constituentName,
			municipality: log.affiliation ?? "Iloilo City",
			barangay: log.affiliation ?? "--",
			sex: sexOption?.label ?? "Unspecified",
			civilStatus: civilStatusOption?.label ?? "Unspecified",
			age: (42 + index * 3).toString(),
			phoneNumber: "0917 123 4567",
			email: "sample@example.com",
			purpose: assistanceType,
			createdAt: log.dateVisited,
			visits: [
				{
					id: `${log.id}-visit`,
					date: log.dateVisited,
					title: "Walk-in Visit",
					assistanceType,
					notes: "",
				},
			],
		};
	},
);

const ASSISTANCE_FILTER_OPTIONS = Array.from(
	new Set(
		MOCK_BENEFICIARIES.map((beneficiary) => beneficiary.purpose).filter(
			(purpose): purpose is string => Boolean(purpose),
		),
	),
).sort();

const PROFILE_TABS: Array<{ id: "overview" | "timeline"; label: string }> = [
	{ id: "overview", label: "Overview" },
	{ id: "timeline", label: "Timeline" },
];

export function BeneficiaryDatabase() {
	const [beneficiaries, setBeneficiaries] =
		useState<BeneficiaryRecord[]>(MOCK_BENEFICIARIES);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [formState, setFormState] = useState(INITIAL_BENEFICIARY_FORM_STATE);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [selectedAssistance, setSelectedAssistance] = useState<string[]>([]);
	const [dateFrom, setDateFrom] = useState<Date | undefined>();
	const [dateTo, setDateTo] = useState<Date | undefined>();
	const [dateOrder, setDateOrder] = useState<"desc" | "asc">("desc");
	const [alphaOrder, setAlphaOrder] = useState<"none" | "asc" | "desc">("none");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<
		string | null
	>(null);
	const [profileTab, setProfileTab] = useState<"overview" | "timeline">(
		"overview",
	);
	const [editingVisit, setEditingVisit] = useState<VisitEditorState | null>(
		null,
	);

	const isDateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo);
	const selectedBeneficiary = selectedBeneficiaryId
		? (beneficiaries.find(
				(beneficiary) => beneficiary.id === selectedBeneficiaryId,
			) ?? null)
		: null;

	useEffect(() => {
		setProfileTab("overview");
	}, [selectedBeneficiaryId]);

	const handleInputChange = (field: keyof typeof formState, value: string) => {
		setFormState((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const requiredFields: Array<keyof typeof formState> = [
			"familyName",
			"firstName",
			"middleName",
			"barangay",
			"sex",
			"civilStatus",
			"age",
			"phoneNumber",
			"purpose",
		];
		const hasMissingField =
			requiredFields.some((field) => formState[field].trim() === "") ||
			formState.municipality.trim() === "";

		if (hasMissingField) {
			setErrorMessage("Please complete all required fields before saving.");
			return;
		}

		setErrorMessage(null);
		setFormState(INITIAL_BENEFICIARY_FORM_STATE);
		setIsDialogOpen(false);
	};

	const totalBeneficiaries = beneficiaries.length;
	const activeFilterCount =
		selectedAssistance.length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
	const hasActiveFilters = activeFilterCount > 0;

	const filteredBeneficiaries = useMemo(() => {
		let data = [...beneficiaries];
		const normalizedQuery = searchQuery.trim().toLowerCase();

		if (normalizedQuery) {
			data = data.filter((beneficiary) =>
				beneficiary.name.toLowerCase().includes(normalizedQuery),
			);
		}

		if (selectedAssistance.length) {
			data = data.filter((beneficiary) => {
				if (!beneficiary.purpose) {
					return false;
				}
				return selectedAssistance.includes(beneficiary.purpose);
			});
		}

		if (dateFrom) {
			const fromTime = startOfDay(dateFrom).getTime();
			data = data.filter(
				(beneficiary) => new Date(beneficiary.createdAt).getTime() >= fromTime,
			);
		}

		if (dateTo) {
			const toTime = endOfDay(dateTo).getTime();
			data = data.filter(
				(beneficiary) => new Date(beneficiary.createdAt).getTime() <= toTime,
			);
		}

		data.sort((a, b) => {
			if (alphaOrder !== "none") {
				return alphaOrder === "asc"
					? a.name.localeCompare(b.name)
					: b.name.localeCompare(a.name);
			}

			const diff =
				new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			return dateOrder === "desc" ? -diff : diff;
		});

		return data;
	}, [
		beneficiaries,
		selectedAssistance,
		dateFrom,
		dateTo,
		alphaOrder,
		dateOrder,
		searchQuery,
	]);

	const handleAssistanceChange = (value: string, checked: boolean) => {
		setSelectedAssistance((prev) =>
			checked ? [...prev, value] : prev.filter((item) => item !== value),
		);
	};

	const clearFilters = () => {
		setSelectedAssistance([]);
		setDateFrom(undefined);
		setDateTo(undefined);
		setIsFilterOpen(false);
	};

	const applyFilters = () => {
		if (isDateRangeInvalid) return;
		setIsFilterOpen(false);
	};

	const handleRowClick = (beneficiaryId: string) => {
		setSelectedBeneficiaryId(beneficiaryId);
	};

	const closeProfileDialog = () => setSelectedBeneficiaryId(null);

	const toggleAlphabeticalOrder = () => {
		setAlphaOrder((prev) => {
			if (prev === "none") return "asc";
			if (prev === "asc") return "desc";
			return "none";
		});
	};

	const handleLogVisit = () => {
		if (!selectedBeneficiary) return;
		const visitId = `${selectedBeneficiary.id}-visit-${Date.now()}`;
		const newVisit: VisitEntry = {
			id: visitId,
			date: new Date().toISOString(),
			title: "Walk-in Visit",
			assistanceType: selectedBeneficiary.purpose || "Assistance Request",
			notes: "",
		};
		setBeneficiaries((prev) =>
			prev.map((beneficiary) =>
				beneficiary.id === selectedBeneficiary.id
					? { ...beneficiary, visits: [...beneficiary.visits, newVisit] }
					: beneficiary,
			),
		);
		setProfileTab("timeline");
		setEditingVisit({ beneficiaryId: selectedBeneficiary.id, visit: newVisit });
	};

	const openVisitEditor = (beneficiaryId: string, visitId: string) => {
		const targetBeneficiary = beneficiaries.find(
			(beneficiary) => beneficiary.id === beneficiaryId,
		);
		const visit = targetBeneficiary?.visits.find(
			(entry) => entry.id === visitId,
		);
		if (!visit) return;
		setEditingVisit({ beneficiaryId, visit: { ...visit } });
		setProfileTab("timeline");
	};

	const handleVisitFieldChange = (
		field: "title" | "assistanceType" | "notes",
		value: string,
	) => {
		setEditingVisit((prev) =>
			prev ? { ...prev, visit: { ...prev.visit, [field]: value } } : prev,
		);
	};

	const handleVisitDetailsSave = () => {
		if (!editingVisit) return;
		setBeneficiaries((prev) =>
			prev.map((beneficiary) => {
				if (beneficiary.id !== editingVisit.beneficiaryId) return beneficiary;
				return {
					...beneficiary,
					visits: beneficiary.visits.map((visit) =>
						visit.id === editingVisit.visit.id ? editingVisit.visit : visit,
					),
				};
			}),
		);
		setEditingVisit(null);
	};

	const handleVisitEditorClose = () => setEditingVisit(null);

	return (
		<>
			<div className="space-y-6">
				<Card className="w-fit px-6 py-4 border border-gray-200 shadow-sm">
					<div className="flex items-center gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50">
							<FileText className="h-6 w-6 text-sky-600" />
						</div>
						<div>
							<p className="text-sm text-gray-500">Total Beneficiaries</p>
							<p className="text-2xl font-semibold text-gray-900">
								{totalBeneficiaries}
							</p>
						</div>
					</div>
				</Card>

				<div className="space-y-4">
					<div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
						<p className="text-sm text-gray-500">
							Only visitors who received assistance or beneficiary services
							appear in this list.
						</p>
						<p className="text-sm text-gray-500">
							Showing {filteredBeneficiaries.length} of {totalBeneficiaries}{" "}
							records
						</p>
					</div>
					<div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
						<div className="flex flex-wrap items-center gap-3">
							<div>
								<span className="sr-only">Sort by date</span>
								<Select
									value={dateOrder}
									onValueChange={(value) =>
										setDateOrder(value as "asc" | "desc")
									}
								>
									<SelectTrigger className="h-10 min-w-35 justify-between rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm focus:ring-2 focus:ring-gray-200">
										<SelectValue placeholder="Sort by date" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="desc">Latest</SelectItem>
										<SelectItem value="asc">Oldest</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className="gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
									>
										<Filter className="h-4 w-4 text-gray-800" />
										Filter
										{hasActiveFilters && (
											<Badge className="ml-1 h-5 rounded-full bg-[#a60202] px-2 py-0 text-[11px] text-white">
												{activeFilterCount}
											</Badge>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-80" align="start">
									<div className="space-y-4">
										<div>
											<h3 className="mb-3 text-sm font-semibold text-gray-900">
												Assistance Requested
											</h3>
											<div className="max-h-40 space-y-2 overflow-y-auto pr-1">
												{ASSISTANCE_FILTER_OPTIONS.length === 0 && (
													<p className="text-sm text-gray-500">
														No assistance types available yet.
													</p>
												)}
												{ASSISTANCE_FILTER_OPTIONS.map((option) => (
													<label
														key={option}
														className="flex cursor-pointer items-center gap-2"
													>
														<Checkbox
															checked={selectedAssistance.includes(option)}
															onCheckedChange={(checked) =>
																handleAssistanceChange(option, Boolean(checked))
															}
														/>
														<span className="text-sm text-gray-600">
															{option}
														</span>
													</label>
												))}
											</div>
										</div>

										<div className="border-t border-gray-100 pt-4">
											<h3 className="mb-3 text-sm font-semibold text-gray-900">
												Date Range
											</h3>
											<div className="grid grid-cols-2 gap-3">
												<DatePickerField
													label="From"
													date={dateFrom}
													onSelect={(date: Date | undefined) =>
														setDateFrom(date)
													}
												/>
												<DatePickerField
													label="To"
													date={dateTo}
													onSelect={(date: Date | undefined) => setDateTo(date)}
													disabled={(day: Date) =>
														dateFrom ? day < dateFrom : false
													}
												/>
											</div>
											{isDateRangeInvalid && (
												<p className="text-xs text-red-600">
													"To" date cannot be earlier than "From" date.
												</p>
											)}
										</div>

										<div className="border-t border-gray-100 pt-4">
											<div className="flex gap-3">
												<Button
													variant="outline"
													className="flex-1"
													onClick={clearFilters}
												>
													Clear
												</Button>
												<Button
													className="flex-1 bg-[#a60202] hover:bg-[#8a0101]"
													onClick={applyFilters}
													disabled={isDateRangeInvalid}
												>
													Apply Filters
												</Button>
											</div>
										</div>
									</div>
								</PopoverContent>
							</Popover>
							<Button
								type="button"
								variant="outline"
								aria-pressed={alphaOrder !== "none"}
								onClick={toggleAlphabeticalOrder}
								title={
									alphaOrder === "desc"
										? "Alphabetical (Z to A)"
										: alphaOrder === "asc"
											? "Alphabetical (A to Z)"
											: "Alphabetical (default)"
								}
								className={`gap-2 rounded-full border px-4 text-sm font-medium shadow-sm transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-200 ${
									alphaOrder !== "none"
										? "border-gray-300 bg-gray-50 text-gray-900"
										: "border-gray-200 bg-white text-gray-900"
								}`}
							>
								<span>Alphabetical</span>
								<ArrowUpDown
									className={`h-4 w-4 text-gray-800 transition-transform ${
										alphaOrder === "desc" ? "rotate-180" : ""
									}`}
								/>
							</Button>
						</div>
						<div className="flex flex-1 items-center justify-start">
							<div className="relative w-full max-w-sm">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
								<Input
									type="search"
									value={searchQuery}
									onChange={(event) => setSearchQuery(event.target.value)}
									placeholder="Search beneficiary"
									className="pl-9"
									aria-label="Search beneficiary"
								/>
							</div>
						</div>
						<div className="flex flex-wrap gap-3 justify-end">
							<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
								<Button
									onClick={() => setIsDialogOpen(true)}
									className="gap-2 rounded-md bg-[#a60202] px-5 py-2 text-white shadow-sm transition hover:bg-[#8a0101]"
								>
									<Plus className="h-4 w-4" />
									Add Beneficiary
								</Button>
								<DialogContent className="sm:max-w-2xl">
									<DialogHeader>
										<DialogTitle>Add Beneficiary</DialogTitle>
										<DialogDescription>
											Fill in beneficiary details for tracking assistance cases.
										</DialogDescription>
									</DialogHeader>
									<form onSubmit={handleSubmit} className="space-y-4">
										{errorMessage && (
											<p className="text-sm text-red-600">{errorMessage}</p>
										)}
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
											<div>
												<label className="text-sm font-medium text-gray-700">
													Family Name <span className="text-red-500">*</span>
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
													First Name <span className="text-red-500">*</span>
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
											<div>
												<label className="text-sm font-medium text-gray-700">
													Middle Name <span className="text-red-500">*</span>
												</label>
												<Input
													value={formState.middleName}
													onChange={(e) =>
														handleInputChange("middleName", e.target.value)
													}
													placeholder="Enter middle name"
													required
												/>
											</div>
										</div>
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											<div>
												<label className="text-sm font-medium text-gray-700">
													Municipality / City{" "}
													<span className="text-red-500">*</span>
												</label>
												<Select
													value={formState.municipality}
													onValueChange={(value) =>
														handleInputChange("municipality", value)
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select municipality" />
													</SelectTrigger>
													<SelectContent className="max-h-60 overflow-y-auto overscroll-contain">
														{ILOILO_LOCALITIES.map((locale) => (
															<SelectItem
																key={`beneficiary-${locale}`}
																value={locale}
															>
																{locale}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">
													Barangay <span className="text-red-500">*</span>
												</label>
												<Input
													value={formState.barangay}
													onChange={(e) =>
														handleInputChange("barangay", e.target.value)
													}
													placeholder="Enter barangay"
													required
												/>
											</div>
											<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
												<div>
													<label className="text-sm font-medium text-gray-700">
														Sex <span className="text-red-500">*</span>
													</label>
													<Select
														value={formState.sex}
														onValueChange={(value) =>
															handleInputChange("sex", value)
														}
													>
														<SelectTrigger>
															<SelectValue placeholder="Select sex" />
														</SelectTrigger>
														<SelectContent>
															{SEX_OPTIONS.map((option) => (
																<SelectItem
																	key={option.value}
																	value={option.value}
																>
																	{option.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
												<div>
													<label className="text-sm font-medium text-gray-700">
														Civil Status <span className="text-red-500">*</span>
													</label>
													<Select
														value={formState.civilStatus}
														onValueChange={(value) =>
															handleInputChange("civilStatus", value)
														}
													>
														<SelectTrigger>
															<SelectValue placeholder="Select civil status" />
														</SelectTrigger>
														<SelectContent>
															{CIVIL_STATUS_OPTIONS.map((option) => (
																<SelectItem
																	key={option.value}
																	value={option.value}
																>
																	{option.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
											</div>
										</div>
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
											<div>
												<label className="text-sm font-medium text-gray-700">
													Age <span className="text-red-500">*</span>
												</label>
												<Input
													type="number"
													min="0"
													value={formState.age}
													onChange={(e) =>
														handleInputChange("age", e.target.value)
													}
													placeholder="Age"
													required
												/>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">
													Phone Number <span className="text-red-500">*</span>
												</label>
												<Input
													type="tel"
													value={formState.phoneNumber}
													onChange={(e) =>
														handleInputChange("phoneNumber", e.target.value)
													}
													placeholder="e.g. 0917 123 4567"
													required
												/>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">
													Email{" "}
													<span className="font-normal text-gray-500">
														(optional)
													</span>
												</label>
												<Input
													type="email"
													value={formState.email}
													onChange={(e) =>
														handleInputChange("email", e.target.value)
													}
													placeholder="name@example.com"
												/>
											</div>
										</div>
										<div>
											<label className="text-sm font-medium text-gray-700">
												Purpose of Assistance{" "}
												<span className="text-red-500">*</span>
											</label>
											<Input
												value={formState.purpose}
												onChange={(e) =>
													handleInputChange("purpose", e.target.value)
												}
												placeholder="Describe assistance needed"
												required
											/>
										</div>
										<DialogFooter>
											<Button
												type="button"
												variant="ghost"
												onClick={() => setIsDialogOpen(false)}
											>
												Cancel
											</Button>
											<Button type="submit">Save Beneficiary</Button>
										</DialogFooter>
									</form>
								</DialogContent>
							</Dialog>

							<Dialog
								open={Boolean(editingVisit)}
								onOpenChange={(open) => {
									if (!open) {
										handleVisitEditorClose();
									}
								}}
							>
								<DialogContent className="sm:max-w-lg">
									<DialogHeader>
										<DialogTitle>Edit Visit Details</DialogTitle>
										<DialogDescription>
											Add context to this visit so assistance history stays
											accurate.
										</DialogDescription>
									</DialogHeader>
									{editingVisit && (
										<form
											onSubmit={(event) => {
												event.preventDefault();
												handleVisitDetailsSave();
											}}
											className="space-y-4"
										>
											<div>
												<label className="text-sm font-medium text-gray-700">
													Visit Title
												</label>
												<Input
													value={editingVisit.visit.title}
													onChange={(event) =>
														handleVisitFieldChange("title", event.target.value)
													}
													placeholder="e.g. Walk-in Visit"
													required
												/>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">
													Assistance Type
												</label>
												<Select
													value={editingVisit.visit.assistanceType}
													onValueChange={(value) =>
														handleVisitFieldChange("assistanceType", value)
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select assistance" />
													</SelectTrigger>
													<SelectContent>
														{ASSISTANCE_TYPES.map((type) => (
															<SelectItem key={type} value={type}>
																{type}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div>
												<label className="text-sm font-medium text-gray-700">
													Notes / Outcome
												</label>
												<Textarea
													value={editingVisit.visit.notes ?? ""}
													onChange={(event) =>
														handleVisitFieldChange("notes", event.target.value)
													}
													placeholder="e.g. ₱3500 for medicine, pending release"
													rows={3}
												/>
											</div>
											<DialogFooter>
												<Button
													type="button"
													variant="ghost"
													onClick={handleVisitEditorClose}
												>
													Cancel
												</Button>
												<Button type="submit">Save Details</Button>
											</DialogFooter>
										</form>
									)}
								</DialogContent>
							</Dialog>
						</div>
					</div>
				</div>
				<div className="rounded-lg border border-gray-200 overflow-hidden">
					<Table>
						<TableHeader className="bg-gray-50">
							<TableRow className="border-b border-gray-200">
								<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-1/4">
									Beneficiary
								</TableHead>
								<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-1/4">
									Municipality / City
								</TableHead>
								<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-1/4">
									Barangay
								</TableHead>
								<TableHead className="px-6 py-3 text-sm font-medium text-gray-700 w-1/4">
									Assistance Requested
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredBeneficiaries.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={4}
										className="px-6 py-8 text-center text-sm text-gray-500"
									>
										No beneficiaries match the selected filters.
									</TableCell>
								</TableRow>
							) : (
								filteredBeneficiaries.map((beneficiary, index) => (
									<TableRow
										key={beneficiary.id}
										onClick={() => handleRowClick(beneficiary.id)}
										onKeyDown={(event) => {
											if (event.key === "Enter" || event.key === " ") {
												event.preventDefault();
												handleRowClick(beneficiary.id);
											}
										}}
										tabIndex={0}
										className={`border-b border-gray-200 cursor-pointer transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 ${
											index % 2 === 1 ? "bg-gray-50/30" : "bg-white"
										}`}
									>
										<TableCell
											className="px-6 py-4 text-sm font-medium text-gray-900 max-w-55 truncate"
											title={beneficiary.name}
										>
											{formatNameDisplay(beneficiary.name)}
										</TableCell>
										<TableCell className="px-6 py-4 text-sm text-gray-900">
											{beneficiary.municipality}
										</TableCell>
										<TableCell className="px-6 py-4 text-sm text-gray-900">
											{beneficiary.barangay}
										</TableCell>
										<TableCell className="px-6 py-4 text-sm text-gray-900">
											{beneficiary.purpose}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			<Dialog
				open={Boolean(selectedBeneficiary)}
				onOpenChange={(open) => {
					if (!open) {
						closeProfileDialog();
					}
				}}
			>
				<DialogContent className="sm:max-w-2xl">
					{selectedBeneficiary && (
						<div className="space-y-6">
							<div className="space-y-4">
								<div className="flex items-start justify-between gap-3">
									<div>
										<DialogTitle className="text-2xl font-semibold text-gray-900">
											{selectedBeneficiary.name}
										</DialogTitle>
										<div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
											<MapPin className="h-4 w-4" />
											<span>
												{selectedBeneficiary.barangay},{" "}
												{selectedBeneficiary.municipality}
											</span>
										</div>
									</div>
									<Badge className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
										{selectedBeneficiary.civilStatus}
									</Badge>
								</div>
								<div className="flex flex-wrap gap-3">
									<Button
										onClick={handleLogVisit}
										className="gap-2 bg-[#1d4ed8] px-5 text-white hover:bg-[#1a3fae]"
									>
										<ClipboardList className="h-4 w-4" />
										Log Visit
									</Button>
									<Button variant="outline" className="px-5">
										Actions
									</Button>
								</div>
							</div>
							<div>
								<div className="flex gap-6 border-b border-gray-200 text-sm font-medium">
									{PROFILE_TABS.map((tab) => (
										<button
											key={tab.id}
											onClick={() => setProfileTab(tab.id)}
											className={`pb-2 ${
												profileTab === tab.id
													? "border-b-2 border-[#1d4ed8] text-gray-900"
													: "text-gray-500 hover:text-gray-800"
											}`}
											type="button"
										>
											{tab.label}
										</button>
									))}
								</div>
								{profileTab === "overview" ? (
									<div className="grid gap-4 pt-4 text-sm text-gray-900 sm:grid-cols-2">
										<div className="space-y-1">
											<p className="text-xs uppercase text-gray-500">Sex</p>
											<p className="font-medium">{selectedBeneficiary.sex}</p>
										</div>
										<div className="space-y-1">
											<p className="text-xs uppercase text-gray-500">Age</p>
											<p className="font-medium">{selectedBeneficiary.age}</p>
										</div>
										<div className="space-y-1">
											<p className="text-xs uppercase text-gray-500">Contact</p>
											<p className="font-medium">
												{selectedBeneficiary.phoneNumber}
											</p>
										</div>
										<div className="space-y-1">
											<p className="text-xs uppercase text-gray-500">Email</p>
											<p className="font-medium">
												{selectedBeneficiary.email || "—"}
											</p>
										</div>
										<div className="space-y-1">
											<p className="text-xs uppercase text-gray-500">
												Registered
											</p>
											<p className="font-medium">
												{format(
													new Date(selectedBeneficiary.createdAt),
													"MMM d, yyyy",
												)}
											</p>
										</div>
										<div className="space-y-1">
											<p className="text-xs uppercase text-gray-500">
												Assistance Requested
											</p>
											<p className="font-medium">
												{selectedBeneficiary.purpose}
											</p>
										</div>
										<div className="space-y-1">
											<p className="text-xs uppercase text-gray-500">
												Municipality / City
											</p>
											<p className="font-medium">
												{selectedBeneficiary.municipality}
											</p>
										</div>
										<div className="space-y-1">
											<p className="text-xs uppercase text-gray-500">
												Barangay
											</p>
											<p className="font-medium">
												{selectedBeneficiary.barangay}
											</p>
										</div>
									</div>
								) : (
									<div className="pt-4">
										{selectedBeneficiary.visits.length === 0 ? (
											<p className="text-sm text-gray-500">
												No visits recorded yet. Use "Log Visit" to add one.
											</p>
										) : (
											<div className="space-y-4">
												{[...selectedBeneficiary.visits]
													.sort(
														(a, b) =>
															new Date(b.date).getTime() -
															new Date(a.date).getTime(),
													)
													.map((visit, index) => {
														const isLatest = index === 0;
														return (
															<div
																key={visit.id}
																className="relative border-l border-gray-200 pl-6 pb-6 last:border-transparent last:pb-0"
															>
																<span
																	className={`absolute -left-1.5 top-2 h-3 w-3 rounded-full border-2 border-white ${
																		isLatest ? "bg-emerald-500" : "bg-sky-500"
																	}`}
																/>
																<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
																	<div
																		className="space-y-1 cursor-pointer"
																		onClick={() =>
																			openVisitEditor(
																				selectedBeneficiary.id,
																				visit.id,
																			)
																		}
																		onKeyDown={(event) => {
																			if (
																				event.key === "Enter" ||
																				event.key === " "
																			) {
																				event.preventDefault();
																				openVisitEditor(
																					selectedBeneficiary.id,
																					visit.id,
																				);
																			}
																		}}
																		role="button"
																		tabIndex={0}
																	>
																		<p className="text-sm font-semibold text-gray-900">
																			{visit.title || "Walk-in Visit"}
																			{isLatest && (
																				<span className="ml-2 text-xs font-medium text-emerald-600">
																					Latest
																				</span>
																			)}
																		</p>
																		<p className="text-xs text-gray-500">
																			{format(
																				new Date(visit.date),
																				"MMMM d, yyyy",
																			)}
																		</p>
																	</div>
																	<div className="flex flex-wrap items-center gap-2">
																		<span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
																			{visit.assistanceType ||
																				"Assistance Request"}
																		</span>
																		{visit.notes ? (
																			<span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-600">
																				{visit.notes}
																			</span>
																		) : null}
																		<Button
																			variant="ghost"
																			className="h-8 w-8 rounded-full p-0 text-gray-500 hover:text-gray-900"
																			onClick={() =>
																				openVisitEditor(
																					selectedBeneficiary.id,
																					visit.id,
																				)
																			}
																			aria-label="Edit visit details"
																		>
																			<PenLine className="h-4 w-4" />
																		</Button>
																	</div>
																</div>
															</div>
														);
													})}
											</div>
										)}
									</div>
								)}
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={closeProfileDialog}>
									Close
								</Button>
							</DialogFooter>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
