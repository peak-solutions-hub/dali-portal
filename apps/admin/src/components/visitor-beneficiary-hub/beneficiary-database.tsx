"use client";

import { isDefinedError } from "@orpc/client";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfDay, format, startOfDay } from "date-fns";
import {
	ArrowUpDown,
	ClipboardList,
	FileText,
	Filter,
	MapPin,
	PenLine,
	Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, orpc } from "@/lib/api.client";
import { AssistanceForm } from "./assistance-form";
import {
	ASSISTANCE_TYPES,
	INITIAL_BENEFICIARY_FORM_STATE,
	type MainFormState,
	SCHOLARSHIP_REQUIRED_FIELDS,
} from "./beneficiary-form-config";
import { DatePickerField } from "./date-picker-field";
import { ScholarshipForm } from "./scholarship-form";

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
	assistanceDetails?: Partial<Record<keyof MainFormState, string>>;
};

type AssistanceType = (typeof ASSISTANCE_TYPES)[number];

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
	assistanceDetails: Record<
		string,
		Partial<Record<keyof MainFormState, string>>
	>;
};

type VisitEditorState = {
	beneficiaryId: string;
	visit: VisitEntry;
};

const INITIAL_BENEFICIARIES: BeneficiaryRecord[] = [];

const ASSISTANCE_REQUIRED_FIELDS: Record<
	AssistanceType,
	Array<keyof MainFormState>
> = {
	"Medicine Assistance": ["medicineName"],
	"Burial Assistance": ["deceasedName", "relationToDeceased"],
	"Hospital Bill Assistance": ["hospitalName"],
	"Laboratory Fees Assistance": ["laboratoryType"],
	"Scholarship Grant": SCHOLARSHIP_REQUIRED_FIELDS,
};

const ASSISTANCE_FIELD_LABELS: Partial<Record<keyof MainFormState, string>> = {
	medicineName: "Medicine / Prescription",
	hospitalName: "Hospital Name",
	deceasedName: "Deceased Name",
	relationToDeceased: "Relation to Deceased",
	laboratoryType: "Laboratory Test Type",
	seq: "SEQ",
	studentId: "Student ID",
	lastName: "Last Name",
	givenName: "Given Name",
	scholarshipMiddleName: "Middle Name",
	scholarshipSex: "Sex",
	scholarshipBirthdate: "Birthdate",
	birthdate: "Birthdate",
	assistanceDate: "Date",
	completeProgramName: "Complete Program Name",
	yearLevel: "Year Level",
	streetBarangay: "Street & Barangay",
	townCityMunicipality: "Town/City/Municipality",
	province: "Province",
	zipCode: "ZIP Code",
	contactNumber: "Contact Number",
	emailAddress: "Email Address",
	heiUii: "HEI UII",
	heiName: "HEI Name",
	fatherLastName: "Father's Last Name",
	fatherGivenName: "Father's Given Name",
	fatherMiddleName: "Father's Middle Name",
	motherMaidenLastName: "Mother's Maiden Last Name",
	motherMaidenGivenName: "Mother's Maiden Given Name",
	motherMaidenMiddleName: "Mother's Maiden Middle Name",
	endorsementDate: "Endorsement Date",
	guardianName: "Name of Guardian",
	guardianContactNo: "Guardian Contact No.",
	guardianEmailAddress: "Guardian Email Address",
};

const ASSISTANCE_FIELD_PLACEHOLDERS: Partial<
	Record<keyof MainFormState, string>
> = {
	medicineName: "Enter medicine details",
	hospitalName: "Enter hospital name",
	deceasedName: "Enter deceased name",
	relationToDeceased: "e.g. Son, Spouse",
	laboratoryType: "Enter requested laboratory test",
	birthdate: "dd/mm/yyyy",
	emailAddress: "name@example.com",
	guardianEmailAddress: "guardian@example.com",
};

const EMAIL_FIELDS = new Set<keyof MainFormState>([
	"emailAddress",
	"guardianEmailAddress",
]);

const SCHOLARSHIP_ACADEMIC_FIELDS: Array<keyof MainFormState> = [
	"studentId",
	"completeProgramName",
	"yearLevel",
	"heiUii",
	"heiName",
];

const PERSONAL_INFORMATION_FIELDS: Array<keyof MainFormState> = [
	"seq",
	"lastName",
	"givenName",
	"scholarshipMiddleName",
	"extName",
	"scholarshipSex",
	"scholarshipBirthdate",
	"contactNumber",
	"emailAddress",
];

const ADDRESS_INFORMATION_FIELDS: Array<keyof MainFormState> = [
	"streetBarangay",
	"townCityMunicipality",
	"province",
	"zipCode",
];

const FAMILY_INFORMATION_FIELDS: Array<keyof MainFormState> = [
	"fatherLastName",
	"fatherGivenName",
	"fatherMiddleName",
	"motherMaidenLastName",
	"motherMaidenGivenName",
	"motherMaidenMiddleName",
	"guardianName",
	"guardianContactNo",
	"guardianEmailAddress",
];

const VISIT_DETAILS_MULTI_STEP_THRESHOLD = 8;
const VISIT_DETAILS_FIELDS_PER_STEP = 8;

function isAssistanceType(value: string): value is AssistanceType {
	return ASSISTANCE_TYPES.includes(value as AssistanceType);
}

function getRequiredFieldsForAssistance(
	assistanceType: string,
): Array<keyof MainFormState> {
	if (!isAssistanceType(assistanceType)) return [];
	return ASSISTANCE_REQUIRED_FIELDS[assistanceType] ?? [];
}

function hasSavedScholarshipProfile(
	beneficiary: BeneficiaryRecord | undefined,
): boolean {
	if (!beneficiary) {
		return false;
	}

	const scholarshipDetails = beneficiary.assistanceDetails["Scholarship Grant"];
	if (!scholarshipDetails) {
		return false;
	}

	return SCHOLARSHIP_REQUIRED_FIELDS.some((field) => {
		const value = scholarshipDetails[field];
		return typeof value === "string" && value.trim() !== "";
	});
}

function getRequiredFieldsForVisit(
	beneficiary: BeneficiaryRecord | undefined,
	assistanceType: string,
): Array<keyof MainFormState> {
	if (
		assistanceType === "Scholarship Grant" &&
		hasSavedScholarshipProfile(beneficiary)
	) {
		return SCHOLARSHIP_ACADEMIC_FIELDS;
	}

	return getRequiredFieldsForAssistance(assistanceType);
}

function chunkFields<T>(fields: T[], chunkSize: number): T[][] {
	if (fields.length === 0) return [];
	const chunks: T[][] = [];
	for (let index = 0; index < fields.length; index += chunkSize) {
		chunks.push(fields.slice(index, index + chunkSize));
	}
	return chunks;
}

function formatAssistanceDetailValue(
	field: keyof MainFormState,
	value: string,
): string {
	if (value.trim() === "") {
		return "-";
	}

	if (field === "scholarshipSex") {
		if (value === "male") return "Male";
		if (value === "female") return "Female";
		if (value === "prefer_not_to_say") return "Prefer not to say";
	}

	if (field.includes("date")) {
		const parsedDate = new Date(value);
		if (!Number.isNaN(parsedDate.getTime())) {
			return format(parsedDate, "MMM d, yyyy");
		}
	}

	return value;
}

const PROFILE_TABS: Array<{ id: "overview" | "timeline"; label: string }> = [
	{ id: "overview", label: "Overview" },
	{ id: "timeline", label: "Timeline" },
];

const normalizeBeneficiaries = (
	data: Array<
		BeneficiaryRecord & {
			visits: Array<
				VisitEntry & {
					assistanceDetails?: Partial<
						Record<keyof MainFormState, string>
					> | null;
				}
			>;
			assistanceDetails: Record<
				string,
				Partial<Record<keyof MainFormState, string>> | null
			>;
		}
	>,
): BeneficiaryRecord[] =>
	data.map((item) => ({
		...item,
		visits: item.visits.map((visit) => ({
			...visit,
			assistanceDetails: (visit.assistanceDetails ?? {}) as Partial<
				Record<keyof MainFormState, string>
			>,
		})),
		assistanceDetails: Object.fromEntries(
			Object.entries(item.assistanceDetails).map(([key, value]) => [
				key,
				value as Partial<Record<keyof MainFormState, string>>,
			]),
		),
	}));

export function BeneficiaryDatabase() {
	const queryClient = useQueryClient();
	const beneficiariesQuery = orpc.beneficiaries.list.queryOptions();
	const { data: beneficiariesData, isLoading: isBeneficiariesLoading } =
		useQuery({
			...beneficiariesQuery,
			staleTime: 5 * 60 * 1000,
			gcTime: 30 * 60 * 1000,
			select: (data) => normalizeBeneficiaries(data ?? []),
		});
	const beneficiaries = beneficiariesData ?? INITIAL_BENEFICIARIES;
	const [isScholarshipDialogOpen, setIsScholarshipDialogOpen] = useState(false);
	const [isAssistanceDialogOpen, setIsAssistanceDialogOpen] = useState(false);
	const [scholarshipFormState, setScholarshipFormState] =
		useState<MainFormState>(INITIAL_BENEFICIARY_FORM_STATE);
	const [assistanceFormState, setAssistanceFormState] = useState<MainFormState>(
		INITIAL_BENEFICIARY_FORM_STATE,
	);
	const [scholarshipErrorMessage, setScholarshipErrorMessage] = useState<
		string | null
	>(null);
	const [assistanceErrorMessage, setAssistanceErrorMessage] = useState<
		string | null
	>(null);
	const [nextScholarshipSeq, setNextScholarshipSeq] = useState(1);
	const [nextAssistanceNo, setNextAssistanceNo] = useState(1);
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
	const [visitEditorError, setVisitEditorError] = useState<string | null>(null);
	const [visitDetailsStep, setVisitDetailsStep] = useState(1);
	const assistanceFilterOptions = useMemo(
		() =>
			Array.from(
				new Set(
					beneficiaries
						.map((beneficiary) => beneficiary.purpose)
						.filter((purpose): purpose is string => Boolean(purpose)),
				),
			).sort(),
		[beneficiaries],
	);

	const isDateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo);
	const selectedBeneficiary = selectedBeneficiaryId
		? (beneficiaries.find(
				(beneficiary) => beneficiary.id === selectedBeneficiaryId,
			) ?? null)
		: null;
	const selectedBeneficiaryProfileSections = useMemo(() => {
		if (!selectedBeneficiary) {
			return [] as Array<{
				title: string;
				fields: Array<{
					field: keyof MainFormState;
					label: string;
					value: string;
				}>;
			}>;
		}

		const mergedDetails = new Map<keyof MainFormState, string>();
		Object.values(selectedBeneficiary.assistanceDetails).forEach((details) => {
			Object.entries(details ?? {}).forEach(([field, value]) => {
				if (typeof value !== "string" || value.trim() === "") {
					return;
				}

				mergedDetails.set(field as keyof MainFormState, value);
			});
		});

		const mapFieldsToDetails = (fields: Array<keyof MainFormState>) =>
			fields
				.filter((field) => {
					const value = mergedDetails.get(field);
					return typeof value === "string" && value.trim() !== "";
				})
				.map((field) => {
					const value = mergedDetails.get(field) ?? "";
					return {
						field,
						label: ASSISTANCE_FIELD_LABELS[field] ?? field,
						value: formatAssistanceDetailValue(field, value),
					};
				});

		const categorizedSections = [
			{
				title: "Personal Information",
				fields: mapFieldsToDetails(PERSONAL_INFORMATION_FIELDS),
			},
			{
				title: "Academic Information",
				fields: mapFieldsToDetails(SCHOLARSHIP_ACADEMIC_FIELDS),
			},
			{
				title: "Address Information",
				fields: mapFieldsToDetails(ADDRESS_INFORMATION_FIELDS),
			},
			{
				title: "Family Information",
				fields: mapFieldsToDetails(FAMILY_INFORMATION_FIELDS),
			},
		].filter((section) => section.fields.length > 0);

		const categorizedFields = new Set<keyof MainFormState>([
			...PERSONAL_INFORMATION_FIELDS,
			...SCHOLARSHIP_ACADEMIC_FIELDS,
			...ADDRESS_INFORMATION_FIELDS,
			...FAMILY_INFORMATION_FIELDS,
		]);

		const additionalFields = Array.from(mergedDetails.entries())
			.filter(([field]) => !categorizedFields.has(field))
			.map(([field, value]) => ({
				field,
				label: ASSISTANCE_FIELD_LABELS[field] ?? field,
				value: formatAssistanceDetailValue(field, value),
			}));

		if (additionalFields.length > 0) {
			categorizedSections.push({
				title: "Other Assistance Information",
				fields: additionalFields,
			});
		}

		return categorizedSections;
	}, [selectedBeneficiary]);
	const editingVisitBeneficiary = editingVisit
		? beneficiaries.find(
				(beneficiary) => beneficiary.id === editingVisit.beneficiaryId,
			)
		: undefined;

	const requiredVisitFields = editingVisit
		? getRequiredFieldsForVisit(
				editingVisitBeneficiary,
				editingVisit.visit.assistanceType,
			)
		: [];
	const visitRequiredFieldSteps =
		requiredVisitFields.length > VISIT_DETAILS_MULTI_STEP_THRESHOLD
			? chunkFields(requiredVisitFields, VISIT_DETAILS_FIELDS_PER_STEP)
			: [requiredVisitFields];
	const totalVisitRequiredSteps = Math.max(visitRequiredFieldSteps.length, 1);
	const activeVisitRequiredStep = Math.min(
		visitDetailsStep,
		totalVisitRequiredSteps,
	);
	const currentVisitRequiredFields =
		visitRequiredFieldSteps[activeVisitRequiredStep - 1] ?? [];
	const isVisitRequiredDetailsMultiStep = totalVisitRequiredSteps > 1;
	const missingRequiredVisitFields = editingVisit
		? requiredVisitFields.filter(
				(field) =>
					(editingVisit.visit.assistanceDetails?.[field] ?? "").trim() === "",
			)
		: [];
	const missingCurrentStepFields = editingVisit
		? currentVisitRequiredFields.filter(
				(field) =>
					(editingVisit.visit.assistanceDetails?.[field] ?? "").trim() === "",
			)
		: [];
	const isRepeatScholarshipVisit =
		editingVisit?.visit.assistanceType === "Scholarship Grant" &&
		hasSavedScholarshipProfile(editingVisitBeneficiary);

	const updateBeneficiaries = (
		updater: (prev: BeneficiaryRecord[]) => BeneficiaryRecord[],
	) => {
		queryClient.setQueryData<BeneficiaryRecord[]>(
			beneficiariesQuery.queryKey,
			(prev) => (prev ? updater(prev) : prev),
		);
	};

	useEffect(() => {
		setProfileTab("overview");
	}, [selectedBeneficiaryId]);

	const formatAutoNumber = (value: number) => value.toString().padStart(4, "0");

	const handleScholarshipInputChange = (
		field: keyof MainFormState,
		value: MainFormState[keyof MainFormState],
	) => {
		setScholarshipFormState((prev) => ({ ...prev, [field]: value }));
	};

	const hasValue = (value: MainFormState[keyof MainFormState]) => {
		if (typeof value === "string") {
			return value.trim() !== "";
		}

		return value instanceof Date;
	};

	const handleAssistanceInputChange = (
		field: keyof MainFormState,
		value: MainFormState[keyof MainFormState],
	) => {
		setAssistanceFormState((prev) => ({ ...prev, [field]: value }));
	};

	const handleScholarshipSubmit = async (
		event: React.FormEvent<HTMLFormElement>,
	) => {
		event.preventDefault();

		const hasMissingFields = SCHOLARSHIP_REQUIRED_FIELDS.some(
			(field) => !hasValue(scholarshipFormState[field]),
		);

		if (hasMissingFields) {
			setScholarshipErrorMessage(
				"Please complete all required scholarship fields before submitting.",
			);
			return;
		}

		const [error] = await api.scholarshipApplications.create({
			seq: scholarshipFormState.seq,
			studentId: scholarshipFormState.studentId,
			lastName: scholarshipFormState.lastName,
			givenName: scholarshipFormState.givenName,
			extName: scholarshipFormState.extName,
			scholarshipMiddleName: scholarshipFormState.scholarshipMiddleName,
			scholarshipSex: scholarshipFormState.scholarshipSex as
				| "male"
				| "female"
				| "prefer_not_to_say",
			scholarshipBirthdate:
				scholarshipFormState.scholarshipBirthdate?.toISOString() ?? "",
			completeProgramName: scholarshipFormState.completeProgramName,
			yearLevel: scholarshipFormState.yearLevel,
			streetBarangay: scholarshipFormState.streetBarangay,
			townCityMunicipality: scholarshipFormState.townCityMunicipality,
			province: scholarshipFormState.province,
			zipCode: scholarshipFormState.zipCode,
			contactNumber: scholarshipFormState.contactNumber,
			emailAddress: scholarshipFormState.emailAddress,
			heiUii: scholarshipFormState.heiUii,
			heiName: scholarshipFormState.heiName,
			fatherLastName: scholarshipFormState.fatherLastName,
			fatherGivenName: scholarshipFormState.fatherGivenName,
			fatherMiddleName: scholarshipFormState.fatherMiddleName,
			motherMaidenLastName: scholarshipFormState.motherMaidenLastName,
			motherMaidenGivenName: scholarshipFormState.motherMaidenGivenName,
			motherMaidenMiddleName: scholarshipFormState.motherMaidenMiddleName,
			guardianName: scholarshipFormState.guardianName,
			guardianContactNo: scholarshipFormState.guardianContactNo,
			guardianEmailAddress: scholarshipFormState.guardianEmailAddress,
		});

		if (error) {
			setScholarshipErrorMessage(
				isDefinedError(error) ? error.message : "Failed to save scholarship.",
			);
			return;
		}

		setScholarshipErrorMessage(null);
		setNextScholarshipSeq((prev) => prev + 1);
		setScholarshipFormState(INITIAL_BENEFICIARY_FORM_STATE);
		setIsScholarshipDialogOpen(false);
		toast.success("Scholarship beneficiary added.");
		await queryClient.invalidateQueries({
			queryKey: beneficiariesQuery.queryKey,
		});
	};

	const handleAssistanceSubmit = async (
		event: React.FormEvent<HTMLFormElement>,
	) => {
		event.preventDefault();

		const assistanceRequiredFields: Array<keyof MainFormState> = [
			"seq",
			"purpose",
			"assistanceDate",
			"firstName",
			"familyName",
			"streetBarangay",
			"contactNumber",
			"laboratoryType",
			"hospitalName",
			"medicineName",
			"givenName",
			"endorsementDate",
		];

		const hasMissingFields = assistanceRequiredFields.some(
			(field) => !hasValue(assistanceFormState[field]),
		);

		if (hasMissingFields) {
			setAssistanceErrorMessage(
				"Please complete all required assistance fields before submitting.",
			);
			return;
		}

		const [error] = await api.assistanceRecords.create({
			seq: assistanceFormState.seq,
			purpose: assistanceFormState.purpose,
			assistanceDate: assistanceFormState.assistanceDate?.toISOString(),
			firstName: assistanceFormState.firstName,
			familyName: assistanceFormState.familyName,
			streetBarangay: assistanceFormState.streetBarangay,
			contactNumber: assistanceFormState.contactNumber,
			laboratoryType: assistanceFormState.laboratoryType,
			hospitalName: assistanceFormState.hospitalName,
			medicineName: assistanceFormState.medicineName,
			givenName: assistanceFormState.givenName,
			endorsementDate: assistanceFormState.endorsementDate?.toISOString() ?? "",
		});

		if (error) {
			setAssistanceErrorMessage(
				isDefinedError(error) ? error.message : "Failed to save assistance.",
			);
			return;
		}

		setAssistanceErrorMessage(null);
		setNextAssistanceNo((prev) => prev + 1);
		setAssistanceFormState(INITIAL_BENEFICIARY_FORM_STATE);
		setIsAssistanceDialogOpen(false);
		toast.success("Assistance beneficiary added.");
		await queryClient.invalidateQueries({
			queryKey: beneficiariesQuery.queryKey,
		});
	};

	const handleScholarshipDialogChange = (open: boolean) => {
		setIsScholarshipDialogOpen(open);
		if (!open) {
			setScholarshipErrorMessage(null);
			setScholarshipFormState(INITIAL_BENEFICIARY_FORM_STATE);
		}
	};

	const handleAssistanceDialogChange = (open: boolean) => {
		setIsAssistanceDialogOpen(open);
		if (!open) {
			setAssistanceErrorMessage(null);
			setAssistanceFormState(INITIAL_BENEFICIARY_FORM_STATE);
		}
	};

	const handleAddScholarshipOpen = () => {
		setScholarshipErrorMessage(null);
		setScholarshipFormState({
			...INITIAL_BENEFICIARY_FORM_STATE,
			purpose: "Scholarship Grant",
			seq: formatAutoNumber(nextScholarshipSeq),
		});
		setIsScholarshipDialogOpen(true);
	};

	const handleAddAssistanceOpen = () => {
		setAssistanceErrorMessage(null);
		setAssistanceFormState({
			...INITIAL_BENEFICIARY_FORM_STATE,
			seq: formatAutoNumber(nextAssistanceNo),
		});
		setIsAssistanceDialogOpen(true);
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
			assistanceDetails: {
				...(isAssistanceType(selectedBeneficiary.purpose)
					? selectedBeneficiary.assistanceDetails[selectedBeneficiary.purpose]
					: {}),
			},
		};
		updateBeneficiaries((prev) =>
			prev.map((beneficiary) =>
				beneficiary.id === selectedBeneficiary.id
					? { ...beneficiary, visits: [...beneficiary.visits, newVisit] }
					: beneficiary,
			),
		);
		setProfileTab("timeline");
		setEditingVisit({ beneficiaryId: selectedBeneficiary.id, visit: newVisit });
		setVisitEditorError(null);
		setVisitDetailsStep(1);
	};

	const openVisitEditor = (beneficiaryId: string, visitId: string) => {
		const targetBeneficiary = beneficiaries.find(
			(beneficiary) => beneficiary.id === beneficiaryId,
		);
		const visit = targetBeneficiary?.visits.find(
			(entry) => entry.id === visitId,
		);
		if (!visit) return;
		const assistanceDetails = isAssistanceType(visit.assistanceType)
			? targetBeneficiary?.assistanceDetails[visit.assistanceType]
			: undefined;
		setEditingVisit({
			beneficiaryId,
			visit: {
				...visit,
				assistanceDetails: {
					...assistanceDetails,
					...visit.assistanceDetails,
				},
			},
		});
		setVisitEditorError(null);
		setVisitDetailsStep(1);
		setProfileTab("timeline");
	};

	const handleVisitFieldChange = (
		field: "title" | "assistanceType" | "notes",
		value: string,
	) => {
		setEditingVisit((prev) => {
			if (!prev) return prev;
			if (field === "assistanceType") {
				const beneficiary = beneficiaries.find(
					(item) => item.id === prev.beneficiaryId,
				);
				const savedDetails = isAssistanceType(value)
					? beneficiary?.assistanceDetails[value]
					: undefined;
				return {
					...prev,
					visit: {
						...prev.visit,
						assistanceType: value,
						assistanceDetails: {
							...savedDetails,
							...prev.visit.assistanceDetails,
						},
					},
				};
			}

			return { ...prev, visit: { ...prev.visit, [field]: value } };
		});
		setVisitEditorError(null);
		if (field === "assistanceType") {
			setVisitDetailsStep(1);
		}
	};

	const handleVisitAssistanceDetailChange = (
		field: keyof MainFormState,
		value: string,
	) => {
		setEditingVisit((prev) =>
			prev
				? {
						...prev,
						visit: {
							...prev.visit,
							assistanceDetails: {
								...prev.visit.assistanceDetails,
								[field]: value,
							},
						},
					}
				: prev,
		);
		setVisitEditorError(null);
	};

	const handleVisitDetailsSave = () => {
		if (!editingVisit) return;
		if (missingRequiredVisitFields.length > 0) {
			if (isVisitRequiredDetailsMultiStep) {
				const firstStepWithMissing = visitRequiredFieldSteps.findIndex((step) =>
					step.some((field) => missingRequiredVisitFields.includes(field)),
				);
				if (firstStepWithMissing >= 0) {
					setVisitDetailsStep(firstStepWithMissing + 1);
				}
			}
			setVisitEditorError(
				"Please complete all required details for this assistance type.",
			);
			return;
		}

		const assistanceType = editingVisit.visit.assistanceType;
		const detailsSnapshot = editingVisit.visit.assistanceDetails ?? {};
		updateBeneficiaries((prev) =>
			prev.map((beneficiary) => {
				if (beneficiary.id !== editingVisit.beneficiaryId) return beneficiary;
				const nextAssistanceDetails = isAssistanceType(assistanceType)
					? {
							...beneficiary.assistanceDetails,
							[assistanceType]: {
								...(beneficiary.assistanceDetails[assistanceType] ?? {}),
								...detailsSnapshot,
							},
						}
					: beneficiary.assistanceDetails;

				return {
					...beneficiary,
					assistanceDetails: nextAssistanceDetails,
					visits: beneficiary.visits.map((visit) =>
						visit.id === editingVisit.visit.id ? editingVisit.visit : visit,
					),
				};
			}),
		);
		setVisitEditorError(null);
		setEditingVisit(null);
	};

	const handleVisitEditorClose = () => {
		setVisitEditorError(null);
		setEditingVisit(null);
		setVisitDetailsStep(1);
	};

	const handleVisitDetailsNextStep = () => {
		if (missingCurrentStepFields.length > 0) {
			setVisitEditorError("Please complete all required fields in this step.");
			return;
		}
		setVisitEditorError(null);
		setVisitDetailsStep((prev) => Math.min(prev + 1, totalVisitRequiredSteps));
	};

	const handleVisitDetailsPreviousStep = () => {
		setVisitEditorError(null);
		setVisitDetailsStep((prev) => Math.max(prev - 1, 1));
	};

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
												{assistanceFilterOptions.length === 0 && (
													<p className="text-sm text-gray-500">
														No assistance types available yet.
													</p>
												)}
												{assistanceFilterOptions.map((option) => (
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
							<Dialog
								open={isScholarshipDialogOpen}
								onOpenChange={handleScholarshipDialogChange}
							>
								<Button
									onClick={handleAddScholarshipOpen}
									className="rounded-md bg-[#a60202] px-5 py-2 text-white shadow-sm transition hover:bg-[#8a0101]"
								>
									Add Scholarship
								</Button>
								<DialogContent className="sm:max-w-2xl">
									<DialogHeader>
										<DialogTitle>Add Scholarship</DialogTitle>
										<DialogDescription>
											Encode scholarship beneficiary details.
										</DialogDescription>
									</DialogHeader>

									<ScholarshipForm
										formState={scholarshipFormState}
										handleInputChange={handleScholarshipInputChange}
										errorMessage={scholarshipErrorMessage}
										onSubmit={handleScholarshipSubmit}
										onCancel={() => setIsScholarshipDialogOpen(false)}
									/>
								</DialogContent>
							</Dialog>

							<Dialog
								open={isAssistanceDialogOpen}
								onOpenChange={handleAssistanceDialogChange}
							>
								<Button
									onClick={handleAddAssistanceOpen}
									className="rounded-md bg-[#a60202] px-5 py-2 text-white shadow-sm transition hover:bg-[#8a0101]"
								>
									Add Assistance
								</Button>
								<DialogContent className="sm:max-w-2xl">
									<DialogHeader>
										<DialogTitle>Add Assistance</DialogTitle>
										<DialogDescription>
											Encode assistance beneficiary details.
										</DialogDescription>
									</DialogHeader>
									<AssistanceForm
										formState={assistanceFormState}
										handleInputChange={handleAssistanceInputChange}
										errorMessage={assistanceErrorMessage}
										onSubmit={handleAssistanceSubmit}
										onCancel={() => setIsAssistanceDialogOpen(false)}
									/>
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
											{visitEditorError && (
												<p className="text-sm text-red-600">
													{visitEditorError}
												</p>
											)}
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
											{requiredVisitFields.length > 0 && (
												<div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3">
													<div>
														<p className="text-sm font-medium text-gray-900">
															Required Details for{" "}
															{editingVisit.visit.assistanceType}
														</p>
														{isVisitRequiredDetailsMultiStep ? (
															<p className="text-xs text-gray-600">
																Step {activeVisitRequiredStep} of{" "}
																{totalVisitRequiredSteps}
															</p>
														) : null}
														{isRepeatScholarshipVisit ? (
															<p className="text-xs text-sky-700">
																Previous scholarship profile loaded. Update
																academic information only.
															</p>
														) : null}
														{missingRequiredVisitFields.length > 0 ? (
															<p className="text-xs text-amber-700">
																Complete{" "}
																{isVisitRequiredDetailsMultiStep
																	? missingCurrentStepFields.length
																	: missingRequiredVisitFields.length}{" "}
																missing required field
																{(isVisitRequiredDetailsMultiStep
																	? missingCurrentStepFields.length
																	: missingRequiredVisitFields.length) > 1
																	? "s"
																	: ""}
																{isVisitRequiredDetailsMultiStep
																	? " in this step"
																	: ""}
																.
															</p>
														) : (
															<p className="text-xs text-emerald-700">
																All required fields for this assistance are
																complete.
															</p>
														)}
													</div>
													<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
														{currentVisitRequiredFields.map((field) => {
															const value =
																editingVisit.visit.assistanceDetails?.[field] ??
																"";
															const label =
																ASSISTANCE_FIELD_LABELS[field] ?? field;
															const isMissing = value.trim() === "";
															if (field === "scholarshipSex") {
																return (
																	<div key={field}>
																		<label className="text-sm font-medium text-gray-700">
																			{label}{" "}
																			<span className="text-red-500">*</span>
																		</label>
																		<Select
																			value={value}
																			onValueChange={(nextValue) =>
																				handleVisitAssistanceDetailChange(
																					field,
																					nextValue,
																				)
																			}
																		>
																			<SelectTrigger
																				className={
																					isMissing
																						? "border-red-300"
																						: undefined
																				}
																			>
																				<SelectValue placeholder="Select sex" />
																			</SelectTrigger>
																			<SelectContent>
																				<SelectItem value="male">
																					Male
																				</SelectItem>
																				<SelectItem value="female">
																					Female
																				</SelectItem>
																				<SelectItem value="prefer_not_to_say">
																					Prefer not to say
																				</SelectItem>
																			</SelectContent>
																		</Select>
																	</div>
																);
															}

															return (
																<div key={field}>
																	<label className="text-sm font-medium text-gray-700">
																		{label}{" "}
																		<span className="text-red-500">*</span>
																	</label>
																	<Input
																		type={
																			EMAIL_FIELDS.has(field) ? "email" : "text"
																		}
																		value={value}
																		onChange={(event) =>
																			handleVisitAssistanceDetailChange(
																				field,
																				event.target.value,
																			)
																		}
																		placeholder={
																			ASSISTANCE_FIELD_PLACEHOLDERS[field] ??
																			"Enter value"
																		}
																		className={
																			isMissing ? "border-red-300" : undefined
																		}
																		required
																	/>
																</div>
															);
														})}
													</div>
												</div>
											)}
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
												{isVisitRequiredDetailsMultiStep &&
													activeVisitRequiredStep > 1 && (
														<Button
															type="button"
															variant="outline"
															onClick={handleVisitDetailsPreviousStep}
														>
															Back
														</Button>
													)}
												{isVisitRequiredDetailsMultiStep &&
												activeVisitRequiredStep < totalVisitRequiredSteps ? (
													<Button
														type="button"
														onClick={handleVisitDetailsNextStep}
													>
														Next
													</Button>
												) : (
													<Button type="submit">Save Details</Button>
												)}
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
							{isBeneficiariesLoading ? (
								<TableRow>
									<TableCell
										colSpan={4}
										className="px-6 py-8 text-center text-sm text-gray-500"
									>
										Loading beneficiaries...
									</TableCell>
								</TableRow>
							) : filteredBeneficiaries.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={4}
										className="px-6 py-8 text-center text-sm text-gray-500"
									>
										{hasActiveFilters
											? "No beneficiaries match the selected filters."
											: "No beneficiaries have been logged yet."}
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
									<div className="space-y-4 pt-4">
										<div className="grid gap-4 text-sm text-gray-900 sm:grid-cols-2">
											<div className="space-y-1">
												<p className="text-xs uppercase text-gray-500">Sex</p>
												<p className="font-medium">{selectedBeneficiary.sex}</p>
											</div>
											<div className="space-y-1">
												<p className="text-xs uppercase text-gray-500">Age</p>
												<p className="font-medium">{selectedBeneficiary.age}</p>
											</div>
											<div className="space-y-1">
												<p className="text-xs uppercase text-gray-500">
													Contact
												</p>
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

										<div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4">
											<p className="text-sm font-semibold text-gray-900">
												Complete Assistance Details
											</p>
											{selectedBeneficiaryProfileSections.length === 0 ? (
												<p className="text-sm text-gray-500">
													No saved assistance details yet.
												</p>
											) : (
												<div className="space-y-4">
													{selectedBeneficiaryProfileSections.map((section) => (
														<div key={section.title} className="space-y-2">
															<p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
																{section.title}
															</p>
															<div className="grid gap-3 sm:grid-cols-2">
																{section.fields.map((detail) => (
																	<div
																		key={`${section.title}-${detail.field}`}
																		className="space-y-0.5"
																	>
																		<p className="text-xs uppercase text-gray-500">
																			{detail.label}
																		</p>
																		<p className="text-sm font-medium text-gray-900">
																			{detail.value}
																		</p>
																	</div>
																))}
															</div>
														</div>
													))}
												</div>
											)}
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
