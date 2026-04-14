import { Button } from "@repo/ui/components/button";
import { DialogFooter } from "@repo/ui/components/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Phone } from "@repo/ui/lib/lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { MainFormState } from "../beneficiary-form-config";

type MainFormProps = {
	formState: MainFormState;
	selectedAssistanceType: string;
	handleInputChange: (field: keyof MainFormState, value: string) => void;
	iloiloLocalities: string[];
	errorMessage: string | null;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	onCancel: () => void;
	onChangeAssistance: () => void;
};

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

const REQUIRED_FIELD_LABELS: Partial<Record<keyof MainFormState, string>> = {
	familyName: "Family Name",
	firstName: "First Name",
	middleName: "Middle Name",
	sex: "Sex",
	civilStatus: "Civil Status",
	age: "Age",
	municipality: "Municipality / City",
	barangay: "Barangay",
	phoneNumber: "Phone Number",
	medicineName: "Medicine / Prescription",
	hospitalName: "Hospital Name",
	deceasedLastName: "Deceased Last Name",
	deceasedGivenName: "Deceased Given Name",
	deceasedMiddleName: "Deceased Middle Name",
	relationToDeceased: "Relation to Deceased",
	laboratoryType: "Laboratory Test Type",
};

export function MainForm({
	formState,
	selectedAssistanceType,
	handleInputChange,
	iloiloLocalities,
	errorMessage,
	onSubmit,
	onCancel,
	onChangeAssistance,
}: MainFormProps) {
	const contactForm = useForm<{ phoneNumber: string }>({
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: { phoneNumber: formState.phoneNumber },
	});
	const [step, setStep] = useState(1);
	const [stepError, setStepError] = useState<string | null>(null);
	const [missingFields, setMissingFields] = useState<
		Array<keyof MainFormState>
	>([]);

	const stepFields = useMemo<Array<keyof MainFormState>>(() => {
		if (step === 1) {
			return [
				"familyName",
				"firstName",
				"middleName",
				"sex",
				"civilStatus",
				"age",
			];
		}

		if (step === 2) {
			return ["municipality", "barangay", "phoneNumber"];
		}

		if (selectedAssistanceType === "Medicine Assistance")
			return ["medicineName"];
		if (selectedAssistanceType === "Hospital Bill Assistance")
			return ["hospitalName"];
		if (selectedAssistanceType === "Burial Assistance")
			return [
				"deceasedLastName",
				"deceasedGivenName",
				"deceasedMiddleName",
				"relationToDeceased",
			];
		if (selectedAssistanceType === "Laboratory Fees Assistance")
			return ["laboratoryType"];

		return [];
	}, [step, selectedAssistanceType]);

	const validateCurrentStep = () => {
		const isEmptyValue = (value: MainFormState[keyof MainFormState]) => {
			if (typeof value === "string") {
				return value.trim() === "";
			}

			return !(value instanceof Date);
		};

		const fieldsWithMissingValue = stepFields.filter((field) =>
			isEmptyValue(formState[field]),
		);
		const hasMissing = fieldsWithMissingValue.length > 0;
		setMissingFields(fieldsWithMissingValue);

		if (hasMissing) {
			setStepError("Please complete all required fields in this step.");
			return false;
		}

		setMissingFields([]);
		setStepError(null);
		return true;
	};

	const hasFieldError = (field: keyof MainFormState) =>
		missingFields.includes(field) && stepFields.includes(field);

	const updateField = (field: keyof MainFormState, value: string) => {
		handleInputChange(field, value);

		if (!missingFields.includes(field) || value.trim() === "") {
			return;
		}

		setMissingFields((previous) =>
			previous.filter((currentField) => currentField !== field),
		);
	};

	const getRequiredFieldMessage = (field: keyof MainFormState) => {
		if (!hasFieldError(field)) {
			return null;
		}

		const label = REQUIRED_FIELD_LABELS[field] ?? "This field";
		return <p className="mt-1 text-xs text-red-600">{label} is required.</p>;
	};

	useEffect(() => {
		contactForm.setValue("phoneNumber", formState.phoneNumber);
	}, [contactForm, formState.phoneNumber]);

	const validatePhMobileInput = (value: string) => {
		if (!value.trim()) {
			return "Contact number is required.";
		}

		const normalized = value.replace(/[\s-]/g, "");
		const isValidPartial =
			/^0\d{0,10}$/.test(normalized) || /^\+\d{0,12}$/.test(normalized);

		return (
			isValidPartial ||
			"Enter a valid Philippine mobile number (e.g. 09XXXXXXXXX or +639XXXXXXXXX)."
		);
	};

	const isStrictPhMobile = (value: string) => {
		const normalized = value.replace(/[\s-]/g, "");
		return /^09\d{9}$/.test(normalized) || /^\+639\d{9}$/.test(normalized);
	};

	const hasStrictPhoneError =
		formState.phoneNumber.trim() !== "" &&
		!isStrictPhMobile(formState.phoneNumber);

	const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
		if (!validateCurrentStep()) {
			event.preventDefault();
			return;
		}

		const normalizedPhone = formState.phoneNumber.replace(/[\s-]/g, "");
		if (
			!/^09\d{9}$/.test(normalizedPhone) &&
			!/^\+639\d{9}$/.test(normalizedPhone)
		) {
			event.preventDefault();
			contactForm.setError("phoneNumber", {
				type: "manual",
				message:
					"Enter a valid Philippine mobile number (e.g. 09XXXXXXXXX or +639XXXXXXXXX).",
			});
			contactForm.setFocus("phoneNumber");
			return;
		}

		contactForm.clearErrors("phoneNumber");

		onSubmit(event);
	};

	const validateStepTwoPhone = () => {
		if (step !== 2 || isStrictPhMobile(formState.phoneNumber)) {
			contactForm.clearErrors("phoneNumber");
			return true;
		}

		setStepError("Please provide a valid Philippine mobile number.");
		contactForm.setError("phoneNumber", {
			type: "manual",
			message:
				"Enter a valid Philippine mobile number (e.g. 09XXXXXXXXX or +639XXXXXXXXX).",
		});
		contactForm.setFocus("phoneNumber");
		return false;
	};

	const StepDot = ({ index }: { index: number }) => {
		const isActive = step === index;
		const isDone = step > index;
		return (
			<div className="flex items-center">
				<div
					className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
						isActive || isDone
							? "bg-violet-600 text-white"
							: "bg-gray-200 text-gray-600"
					}`}
				>
					{index}
				</div>
				{index < 3 && <div className="mx-2 h-0.5 w-10 bg-gray-200" />}
			</div>
		);
	};

	return (
		<Form {...contactForm}>
			<form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
				{errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
				{stepError && <p className="text-sm text-red-600">{stepError}</p>}

				<div className="flex items-center justify-center">
					<StepDot index={1} />
					<StepDot index={2} />
					<StepDot index={3} />
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
					<div>
						<p className="text-xs uppercase text-gray-500">Assistance Type</p>
						<p className="text-sm font-semibold text-gray-900">
							{selectedAssistanceType}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-xs text-gray-500">Step {step} of 3</span>
						<Button
							type="button"
							variant="outline"
							onClick={onChangeAssistance}
						>
							Change
						</Button>
					</div>
				</div>

				{step === 1 && (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div>
							<label className="text-sm font-medium text-gray-700">
								Family Name <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("familyName") ? "border-red-500" : undefined
								}
								value={formState.familyName}
								onChange={(e) => updateField("familyName", e.target.value)}
								placeholder="Enter family name"
								required
							/>
							{getRequiredFieldMessage("familyName")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								First Name <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("firstName") ? "border-red-500" : undefined
								}
								value={formState.firstName}
								onChange={(e) => updateField("firstName", e.target.value)}
								placeholder="Enter first name"
								required
							/>
							{getRequiredFieldMessage("firstName")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Middle Name <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("middleName") ? "border-red-500" : undefined
								}
								value={formState.middleName}
								onChange={(e) => updateField("middleName", e.target.value)}
								placeholder="Enter middle name"
								required
							/>
							{getRequiredFieldMessage("middleName")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Sex <span className="text-red-500">*</span>
							</label>
							<Select
								value={formState.sex}
								onValueChange={(value) => updateField("sex", value)}
							>
								<SelectTrigger
									className={
										hasFieldError("sex") ? "border-red-500" : undefined
									}
								>
									<SelectValue placeholder="Select sex" />
								</SelectTrigger>
								<SelectContent>
									{SEX_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{getRequiredFieldMessage("sex")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Civil Status <span className="text-red-500">*</span>
							</label>
							<Select
								value={formState.civilStatus}
								onValueChange={(value) => updateField("civilStatus", value)}
							>
								<SelectTrigger
									className={
										hasFieldError("civilStatus") ? "border-red-500" : undefined
									}
								>
									<SelectValue placeholder="Select civil status" />
								</SelectTrigger>
								<SelectContent>
									{CIVIL_STATUS_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{getRequiredFieldMessage("civilStatus")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Age <span className="text-red-500">*</span>
							</label>
							<Input
								className={hasFieldError("age") ? "border-red-500" : undefined}
								type="number"
								min="0"
								value={formState.age}
								onChange={(e) => updateField("age", e.target.value)}
								placeholder="Age"
								required
							/>
							{getRequiredFieldMessage("age")}
						</div>
					</div>
				)}

				{step === 2 && (
					<>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label className="text-sm font-medium text-gray-700">
									Municipality / City <span className="text-red-500">*</span>
								</label>
								<Select
									value={formState.municipality}
									onValueChange={(value) => updateField("municipality", value)}
								>
									<SelectTrigger
										className={
											hasFieldError("municipality")
												? "border-red-500"
												: undefined
										}
									>
										<SelectValue placeholder="Select municipality" />
									</SelectTrigger>
									<SelectContent className="max-h-60 overflow-y-auto overscroll-contain">
										{iloiloLocalities.map((locale) => (
											<SelectItem key={`beneficiary-${locale}`} value={locale}>
												{locale}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{getRequiredFieldMessage("municipality")}
							</div>
							<div>
								<label className="text-sm font-medium text-gray-700">
									Barangay <span className="text-red-500">*</span>
								</label>
								<Input
									className={
										hasFieldError("barangay") ? "border-red-500" : undefined
									}
									value={formState.barangay}
									onChange={(e) => updateField("barangay", e.target.value)}
									placeholder="Enter barangay"
									required
								/>
								{getRequiredFieldMessage("barangay")}
							</div>
						</div>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<FormField
								control={contactForm.control}
								name="phoneNumber"
								rules={{ validate: validatePhMobileInput }}
								render={({ field, fieldState }) => (
									<FormItem>
										<FormLabel className="text-gray-700 font-medium">
											Phone Number <span className="text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<div className="relative group">
												<Phone className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-[#a60202] transition-colors" />
												<Input
													{...field}
													type="tel"
													aria-invalid={
														fieldState.invalid || hasFieldError("phoneNumber")
													}
													className={`pl-11 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#a60202] focus:ring-[#a60202]/20 rounded-xl transition-all ${
														hasFieldError("phoneNumber") || hasStrictPhoneError
															? "border-red-500"
															: ""
													}`}
													value={field.value ?? ""}
													onChange={(event) => {
														field.onChange(event.target.value);
														updateField("phoneNumber", event.target.value);
													}}
													placeholder="e.g. 09XX XXX XXXX"
													title="Enter a valid Philippine mobile number (e.g., 09XXXXXXXXX or +639XXXXXXXXX)."
													required
												/>
											</div>
										</FormControl>
										<FormDescription className="text-xs text-gray-500 mt-1.5 ml-1">
											Philippine mobile number (e.g. 09XX or +639XX).
										</FormDescription>
										<FormMessage className="text-xs mt-1" />
										{getRequiredFieldMessage("phoneNumber")}
									</FormItem>
								)}
							/>
							<div>
								<label className="text-sm font-medium text-gray-700">
									Email{" "}
									<span className="font-normal text-gray-500">(optional)</span>
								</label>
								<Input
									type="email"
									value={formState.email}
									onChange={(e) => updateField("email", e.target.value)}
									placeholder="name@example.com"
									pattern="^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
									title="Enter a valid email address (e.g., name@example.com)."
								/>
							</div>
						</div>
					</>
				)}

				{step === 3 && (
					<>
						{selectedAssistanceType === "Medicine Assistance" && (
							<div>
								<label className="text-sm font-medium text-gray-700">
									Medicine / Prescription{" "}
									<span className="text-red-500">*</span>
								</label>
								<Input
									className={
										hasFieldError("medicineName") ? "border-red-500" : undefined
									}
									value={formState.medicineName}
									onChange={(e) => updateField("medicineName", e.target.value)}
									placeholder="Enter medicine details"
									required
								/>
								{getRequiredFieldMessage("medicineName")}
							</div>
						)}

						{selectedAssistanceType === "Hospital Bill Assistance" && (
							<div>
								<label className="text-sm font-medium text-gray-700">
									Hospital Name <span className="text-red-500">*</span>
								</label>
								<Input
									className={
										hasFieldError("hospitalName") ? "border-red-500" : undefined
									}
									value={formState.hospitalName}
									onChange={(e) => updateField("hospitalName", e.target.value)}
									placeholder="Enter hospital name"
									required
								/>
								{getRequiredFieldMessage("hospitalName")}
							</div>
						)}

						{selectedAssistanceType === "Burial Assistance" && (
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label className="text-sm font-medium text-gray-700">
										Deceased Last Name <span className="text-red-500">*</span>
									</label>
									<Input
										className={
											hasFieldError("deceasedLastName")
												? "border-red-500"
												: undefined
										}
										value={formState.deceasedLastName}
										onChange={(e) =>
											updateField("deceasedLastName", e.target.value)
										}
										placeholder="Enter deceased last name"
										required
									/>
									{getRequiredFieldMessage("deceasedLastName")}
								</div>
								<div>
									<label className="text-sm font-medium text-gray-700">
										Deceased Given Name <span className="text-red-500">*</span>
									</label>
									<Input
										className={
											hasFieldError("deceasedGivenName")
												? "border-red-500"
												: undefined
										}
										value={formState.deceasedGivenName}
										onChange={(e) =>
											updateField("deceasedGivenName", e.target.value)
										}
										placeholder="Enter deceased given name"
										required
									/>
									{getRequiredFieldMessage("deceasedGivenName")}
								</div>
								<div>
									<label className="text-sm font-medium text-gray-700">
										Deceased Middle Name <span className="text-red-500">*</span>
									</label>
									<Input
										className={
											hasFieldError("deceasedMiddleName")
												? "border-red-500"
												: undefined
										}
										value={formState.deceasedMiddleName}
										onChange={(e) =>
											updateField("deceasedMiddleName", e.target.value)
										}
										placeholder="Enter deceased middle name"
										required
									/>
									{getRequiredFieldMessage("deceasedMiddleName")}
								</div>
								<div>
									<label className="text-sm font-medium text-gray-700">
										Relation to Deceased <span className="text-red-500">*</span>
									</label>
									<Input
										className={
											hasFieldError("relationToDeceased")
												? "border-red-500"
												: undefined
										}
										value={formState.relationToDeceased}
										onChange={(e) =>
											updateField("relationToDeceased", e.target.value)
										}
										placeholder="e.g. Son, Spouse"
										required
									/>
									{getRequiredFieldMessage("relationToDeceased")}
								</div>
							</div>
						)}

						{selectedAssistanceType === "Laboratory Fees Assistance" && (
							<div>
								<label className="text-sm font-medium text-gray-700">
									Laboratory Test Type <span className="text-red-500">*</span>
								</label>
								<Input
									className={
										hasFieldError("laboratoryType")
											? "border-red-500"
											: undefined
									}
									value={formState.laboratoryType}
									onChange={(e) =>
										updateField("laboratoryType", e.target.value)
									}
									placeholder="Enter requested laboratory test"
									required
								/>
								{getRequiredFieldMessage("laboratoryType")}
							</div>
						)}
					</>
				)}

				<DialogFooter className="flex w-full items-center justify-between sm:justify-between">
					<div className="flex items-center gap-2">
						<Button type="button" variant="ghost" onClick={onCancel}>
							Cancel
						</Button>
						{step > 1 && (
							<Button
								type="button"
								variant="outline"
								onClick={() => setStep((prev) => prev - 1)}
							>
								Previous
							</Button>
						)}
					</div>
					<div>
						{step < 3 ? (
							<Button
								type="button"
								onClick={() => {
									if (!validateCurrentStep()) return;
									if (!validateStepTwoPhone()) return;
									setStep((prev) => prev + 1);
								}}
							>
								Next
							</Button>
						) : (
							<Button type="submit">Save Beneficiary</Button>
						)}
					</div>
				</DialogFooter>
			</form>
		</Form>
	);
}
