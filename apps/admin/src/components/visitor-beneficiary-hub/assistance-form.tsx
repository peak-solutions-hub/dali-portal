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
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { MainFormState } from "./beneficiary-form-config";
import { DatePickerField } from "./date-picker-field";

type AssistanceFormProps = {
	formState: MainFormState;
	errorMessage: string | null;
	handleInputChange: (
		field: keyof MainFormState,
		value: MainFormState[keyof MainFormState],
	) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	onCancel: () => void;
};

const ASSISTANCE_TYPES = [
	"Medicine Assistance",
	"Hospital Bill Assistance",
	"Laboratory Fees Assistance",
	"Burial Assistance",
] as const;

const REQUIRED_FIELD_LABELS: Partial<Record<keyof MainFormState, string>> = {
	purpose: "Assistance Type",
	claimantLastName: "Claimant Last Name",
	claimantGivenName: "Claimant Given Name",
	claimantMiddleName: "Claimant Middle Name",
	street: "Street",
	subdivisionVillage: "Subdivision/Village",
	scholarshipBarangay: "Barangay",
	cityMunicipality: "City/Municipality",
	province: "Province",
	zipCode: "ZIP Code",
	contactNumber: "Contact Number",
	patientLastName: "Patient Last Name",
	patientGivenName: "Patient Given Name",
	patientMiddleName: "Patient Middle Name",
	deceasedLastName: "Deceased Last Name",
	deceasedGivenName: "Deceased Given Name",
	deceasedMiddleName: "Deceased Middle Name",
	burialDate: "Date of Burial",
};

const BASE_INPUT_CLASSES =
	"h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#a60202] focus:ring-[#a60202]/20 rounded-xl transition-all";

const getInputClassName = (hasError?: boolean) =>
	`${BASE_INPUT_CLASSES}${hasError ? " border-red-500" : ""}`;

export function AssistanceForm({
	formState,
	errorMessage,
	handleInputChange,
	onSubmit,
	onCancel,
}: AssistanceFormProps) {
	const [step, setStep] = useState(1);
	const contactForm = useForm<{ contactNumber: string }>({
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: { contactNumber: formState.contactNumber },
	});

	const isBurialAssistance = formState.purpose === "Burial Assistance";

	const STEP_ONE_REQUIRED_FIELDS: Array<keyof MainFormState> = ["purpose"];
	const STEP_TWO_REQUIRED_FIELDS: Array<keyof MainFormState> = [
		"claimantLastName",
		"claimantGivenName",
		"claimantMiddleName",
		"street",
		"subdivisionVillage",
		"scholarshipBarangay",
		"cityMunicipality",
		"province",
		"zipCode",
		"contactNumber",
	];
	const STEP_THREE_REQUIRED_FIELDS: Array<keyof MainFormState> =
		isBurialAssistance
			? [
					"deceasedLastName",
					"deceasedGivenName",
					"deceasedMiddleName",
					"burialDate",
				]
			: ["patientLastName", "patientGivenName", "patientMiddleName"];

	const currentStepFields = useMemo(() => {
		if (step === 1) return STEP_ONE_REQUIRED_FIELDS;
		if (step === 2) return STEP_TWO_REQUIRED_FIELDS;
		return STEP_THREE_REQUIRED_FIELDS;
	}, [step, isBurialAssistance]);

	const [missingFields, setMissingFields] = useState<
		Array<keyof MainFormState>
	>([]);

	const isEmptyValue = (value: MainFormState[keyof MainFormState]) => {
		if (typeof value === "string") {
			return value.trim() === "";
		}

		return !(value instanceof Date);
	};

	const hasFieldError = (field: keyof MainFormState) =>
		missingFields.includes(field) && currentStepFields.includes(field);

	const validateForm = () => {
		const fieldsWithMissingValue = currentStepFields.filter((field) =>
			isEmptyValue(formState[field]),
		);

		setMissingFields(fieldsWithMissingValue);
		return fieldsWithMissingValue.length === 0;
	};

	const updateField = (
		field: keyof MainFormState,
		value: MainFormState[keyof MainFormState],
	) => {
		handleInputChange(field, value);

		if (!missingFields.includes(field) || isEmptyValue(value)) {
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

	const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
		if (step < 3) {
			event.preventDefault();
			if (!validateForm()) {
				return;
			}

			if (step === 2) {
				const normalizedContact = formState.contactNumber.replace(/[\s-]/g, "");
				if (
					!/^09\d{9}$/.test(normalizedContact) &&
					!/^\+639\d{9}$/.test(normalizedContact)
				) {
					contactForm.setError("contactNumber", {
						type: "manual",
						message:
							"Enter a valid Philippine mobile number (e.g. 09XXXXXXXXX or +639XXXXXXXXX).",
					});
					contactForm.setFocus("contactNumber");
					return;
				}

				contactForm.clearErrors("contactNumber");
			}

			setStep((prev) => prev + 1);
			return;
		}

		if (!validateForm()) {
			event.preventDefault();
			return;
		}

		const normalizedContact = formState.contactNumber.replace(/[\s-]/g, "");
		if (
			!/^09\d{9}$/.test(normalizedContact) &&
			!/^\+639\d{9}$/.test(normalizedContact)
		) {
			event.preventDefault();
			contactForm.setError("contactNumber", {
				type: "manual",
				message:
					"Enter a valid Philippine mobile number (e.g. 09XXXXXXXXX or +639XXXXXXXXX).",
			});
			contactForm.setFocus("contactNumber");
			return;
		}

		contactForm.clearErrors("contactNumber");

		onSubmit(event);
	};

	useEffect(() => {
		contactForm.setValue("contactNumber", formState.contactNumber);
	}, [contactForm, formState.contactNumber]);

	const validatePhMobileInput = (value: string) => {
		if (!value.trim()) return true;

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

	const hasStrictContactError =
		formState.contactNumber.trim() !== "" &&
		!isStrictPhMobile(formState.contactNumber);

	return (
		<Form {...contactForm}>
			<form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
				{errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

				<div className="flex items-center justify-center overflow-x-auto pb-1">
					{[1, 2, 3].map((index) => (
						<div key={index} className="flex items-center">
							<div
								className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
									step >= index
										? "bg-[#a60202] text-white"
										: "bg-gray-200 text-gray-600"
								}`}
							>
								{index}
							</div>
							{index < 3 && <div className="mx-2 h-0.5 w-6 bg-gray-200" />}
						</div>
					))}
				</div>

				{step === 1 && (
					<div>
						<label className="text-sm font-medium text-gray-700">
							Assistance Type <span className="text-red-500">*</span>
						</label>
						<Select
							value={formState.purpose}
							onValueChange={(value) => updateField("purpose", value)}
						>
							<SelectTrigger
								className={
									hasFieldError("purpose") ? "border-red-500" : undefined
								}
							>
								<SelectValue placeholder="Select assistance type" />
							</SelectTrigger>
							<SelectContent>
								{ASSISTANCE_TYPES.map((type) => (
									<SelectItem key={type} value={type}>
										{type}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{getRequiredFieldMessage("purpose")}
					</div>
				)}

				<div className="rounded-md border border-gray-200 bg-gray-50 p-3">
					<p className="text-xs uppercase text-gray-500">NO. (Auto-assigned)</p>
					<Input value={formState.seq} readOnly className="mt-2 bg-white" />
				</div>

				{step === 2 && (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label className="text-sm font-medium text-gray-700">
								Claimant Last Name <span className="text-red-500">*</span>
							</label>
							<Input
								className={getInputClassName(hasFieldError("claimantLastName"))}
								value={formState.claimantLastName}
								onChange={(event) =>
									updateField("claimantLastName", event.target.value)
								}
								placeholder="Enter claimant last name"
								required
							/>
							{getRequiredFieldMessage("claimantLastName")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Claimant Given Name <span className="text-red-500">*</span>
							</label>
							<Input
								className={getInputClassName(
									hasFieldError("claimantGivenName"),
								)}
								value={formState.claimantGivenName}
								onChange={(event) =>
									updateField("claimantGivenName", event.target.value)
								}
								placeholder="Enter claimant given name"
								required
							/>
							{getRequiredFieldMessage("claimantGivenName")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Claimant Middle Name <span className="text-red-500">*</span>
							</label>
							<Input
								className={getInputClassName(
									hasFieldError("claimantMiddleName"),
								)}
								value={formState.claimantMiddleName}
								onChange={(event) =>
									updateField("claimantMiddleName", event.target.value)
								}
								placeholder="Enter claimant middle name"
								required
							/>
							{getRequiredFieldMessage("claimantMiddleName")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Street <span className="text-red-500">*</span>
							</label>
							<Input
								className={getInputClassName(hasFieldError("street"))}
								value={formState.street}
								onChange={(event) => updateField("street", event.target.value)}
								placeholder="Enter street"
								required
							/>
							{getRequiredFieldMessage("street")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Subdivision/Village <span className="text-red-500">*</span>
							</label>
							<Input
								className={getInputClassName(
									hasFieldError("subdivisionVillage"),
								)}
								value={formState.subdivisionVillage}
								onChange={(event) =>
									updateField("subdivisionVillage", event.target.value)
								}
								placeholder="Enter subdivision/village"
								required
							/>
							{getRequiredFieldMessage("subdivisionVillage")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Barangay <span className="text-red-500">*</span>
							</label>
							<Input
								className={getInputClassName(
									hasFieldError("scholarshipBarangay"),
								)}
								value={formState.scholarshipBarangay}
								onChange={(event) =>
									updateField("scholarshipBarangay", event.target.value)
								}
								placeholder="Enter barangay"
								required
							/>
							{getRequiredFieldMessage("scholarshipBarangay")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								City/Municipality <span className="text-red-500">*</span>
							</label>
							<Input
								className={getInputClassName(hasFieldError("cityMunicipality"))}
								value={formState.cityMunicipality}
								onChange={(event) =>
									updateField("cityMunicipality", event.target.value)
								}
								placeholder="Enter city/municipality"
								required
							/>
							{getRequiredFieldMessage("cityMunicipality")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Province <span className="text-red-500">*</span>
							</label>
							<Input
								className={getInputClassName(hasFieldError("province"))}
								value={formState.province}
								onChange={(event) =>
									updateField("province", event.target.value)
								}
								placeholder="Enter province"
								required
							/>
							{getRequiredFieldMessage("province")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								ZIP Code <span className="text-red-500">*</span>
							</label>
							<Input
								className={getInputClassName(hasFieldError("zipCode"))}
								value={formState.zipCode}
								onChange={(event) => updateField("zipCode", event.target.value)}
								placeholder="Enter ZIP code"
								required
							/>
							{getRequiredFieldMessage("zipCode")}
						</div>
						<FormField
							control={contactForm.control}
							name="contactNumber"
							rules={{ validate: validatePhMobileInput }}
							render={({ field, fieldState }) => (
								<FormItem>
									<FormLabel className="text-gray-700 font-medium">
										Contact Number <span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<div>
											<Input
												{...field}
												type="tel"
												aria-invalid={
													fieldState.invalid || hasFieldError("contactNumber")
												}
												className={getInputClassName(
													fieldState.invalid ||
														hasFieldError("contactNumber") ||
														hasStrictContactError,
												)}
												value={field.value ?? ""}
												onChange={(event) => {
													field.onChange(event.target.value);
													updateField("contactNumber", event.target.value);
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
									{getRequiredFieldMessage("contactNumber")}
								</FormItem>
							)}
						/>
					</div>
				)}

				{step === 3 && (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<label className="text-sm font-medium text-gray-700">
								{isBurialAssistance
									? "Deceased Last Name"
									: "Patient Last Name"}{" "}
								<span className="text-red-500">*</span>
							</label>
							<Input
								className={getInputClassName(
									hasFieldError(
										isBurialAssistance ? "deceasedLastName" : "patientLastName",
									),
								)}
								value={
									isBurialAssistance
										? formState.deceasedLastName
										: formState.patientLastName
								}
								onChange={(event) =>
									updateField(
										isBurialAssistance ? "deceasedLastName" : "patientLastName",
										event.target.value,
									)
								}
								placeholder={
									isBurialAssistance
										? "Enter deceased last name"
										: "Enter patient last name"
								}
								required
							/>
							{getRequiredFieldMessage(
								isBurialAssistance ? "deceasedLastName" : "patientLastName",
							)}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								{isBurialAssistance
									? "Deceased Given Name"
									: "Patient Given Name"}{" "}
								<span className="text-red-500">*</span>
							</label>
							<Input
								className={getInputClassName(
									hasFieldError(
										isBurialAssistance
											? "deceasedGivenName"
											: "patientGivenName",
									),
								)}
								value={
									isBurialAssistance
										? formState.deceasedGivenName
										: formState.patientGivenName
								}
								onChange={(event) =>
									updateField(
										isBurialAssistance
											? "deceasedGivenName"
											: "patientGivenName",
										event.target.value,
									)
								}
								placeholder={
									isBurialAssistance
										? "Enter deceased given name"
										: "Enter patient given name"
								}
								required
							/>
							{getRequiredFieldMessage(
								isBurialAssistance ? "deceasedGivenName" : "patientGivenName",
							)}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								{isBurialAssistance
									? "Deceased Middle Name"
									: "Patient Middle Name"}{" "}
								<span className="text-red-500">*</span>
							</label>
							<Input
								className={getInputClassName(
									hasFieldError(
										isBurialAssistance
											? "deceasedMiddleName"
											: "patientMiddleName",
									),
								)}
								value={
									isBurialAssistance
										? formState.deceasedMiddleName
										: formState.patientMiddleName
								}
								onChange={(event) =>
									updateField(
										isBurialAssistance
											? "deceasedMiddleName"
											: "patientMiddleName",
										event.target.value,
									)
								}
								placeholder={
									isBurialAssistance
										? "Enter deceased middle name"
										: "Enter patient middle name"
								}
								required
							/>
							{getRequiredFieldMessage(
								isBurialAssistance ? "deceasedMiddleName" : "patientMiddleName",
							)}
						</div>

						{isBurialAssistance && (
							<>
								<DatePickerField
									label="Date of Burial *"
									date={formState.burialDate}
									onSelect={(date) => updateField("burialDate", date)}
									error={hasFieldError("burialDate")}
									showIcon={false}
								/>
							</>
						)}
					</div>
				)}

				<DialogFooter className="flex w-full items-center justify-between sm:justify-between">
					<Button type="button" variant="ghost" onClick={onCancel}>
						Cancel
					</Button>
					<div className="flex items-center gap-2">
						{step > 1 && (
							<Button
								type="button"
								variant="outline"
								onClick={() => setStep((prev) => prev - 1)}
							>
								Previous
							</Button>
						)}
						<Button type="submit">{step < 3 ? "Next" : "Submit"}</Button>
					</div>
				</DialogFooter>
			</form>
		</Form>
	);
}
