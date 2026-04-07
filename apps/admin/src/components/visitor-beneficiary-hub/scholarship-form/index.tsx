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
import { DatePickerField } from "../date-picker-field";

type ScholarshipFormProps = {
	formState: MainFormState;
	handleInputChange: (
		field: keyof MainFormState,
		value: MainFormState[keyof MainFormState],
	) => void;
	errorMessage: string | null;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	onCancel: () => void;
};

const STEP_ONE_REQUIRED_FIELDS: Array<keyof MainFormState> = [
	"lastName",
	"givenName",
	"scholarshipMiddleName",
	"scholarshipSex",
	"scholarshipBirthdate",
	"contactNumber",
];

const STEP_TWO_REQUIRED_FIELDS: Array<keyof MainFormState> = [
	"studentId",
	"completeProgramName",
	"yearLevel",
	"heiUii",
	"heiName",
];

const STEP_THREE_REQUIRED_FIELDS: Array<keyof MainFormState> = [
	"streetBarangay",
	"townCityMunicipality",
	"province",
	"zipCode",
];

const STEP_FOUR_REQUIRED_FIELDS: Array<keyof MainFormState> = [
	"fatherLastName",
	"fatherGivenName",
	"fatherMiddleName",
	"motherMaidenLastName",
	"motherMaidenGivenName",
	"motherMaidenMiddleName",
];

const STEP_FIVE_REQUIRED_FIELDS: Array<keyof MainFormState> = [
	"guardianName",
	"guardianContactNo",
];

const TOTAL_STEPS = 5;

export function ScholarshipForm({
	formState,
	handleInputChange,
	errorMessage,
	onSubmit,
	onCancel,
}: ScholarshipFormProps) {
	const contactForm = useForm<{
		contactNumber: string;
		guardianContactNo: string;
	}>({
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: {
			contactNumber: formState.contactNumber,
			guardianContactNo: formState.guardianContactNo,
		},
	});
	const [step, setStep] = useState(1);
	const [stepError, setStepError] = useState<string | null>(null);
	const [missingFields, setMissingFields] = useState<
		Array<keyof MainFormState>
	>([]);

	const currentStepFields = useMemo(() => {
		if (step === 1) return STEP_ONE_REQUIRED_FIELDS;
		if (step === 2) return STEP_TWO_REQUIRED_FIELDS;
		if (step === 3) return STEP_THREE_REQUIRED_FIELDS;
		if (step === 4) return STEP_FOUR_REQUIRED_FIELDS;
		return STEP_FIVE_REQUIRED_FIELDS;
	}, [step]);

	const isEmptyValue = (value: MainFormState[keyof MainFormState]) => {
		if (typeof value === "string") {
			return value.trim() === "";
		}

		return !(value instanceof Date);
	};

	const canMoveToNext = () => {
		const fieldsWithMissingValue = currentStepFields.filter((field) =>
			isEmptyValue(formState[field]),
		);

		const hasMissing = fieldsWithMissingValue.length > 0;
		setMissingFields(fieldsWithMissingValue);

		if (hasMissing) {
			setStepError("Please complete all required fields in this step.");
			return false;
		}

		setStepError(null);
		setMissingFields([]);
		return true;
	};

	const hasFieldError = (field: keyof MainFormState) =>
		missingFields.includes(field) && currentStepFields.includes(field);

	const updateField = (
		field: keyof MainFormState,
		value: MainFormState[keyof MainFormState],
	) => {
		handleInputChange(field, value);

		if (!missingFields.includes(field)) {
			return;
		}

		if (isEmptyValue(value)) {
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

		return <p className="mt-1 text-xs text-red-600">This field is required.</p>;
	};

	const StepDot = ({ index }: { index: number }) => {
		const isActive = step === index;
		const isDone = step > index;
		return (
			<div className="flex items-center">
				<div
					className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
						isActive || isDone
							? "bg-[#a60202] text-white"
							: "bg-gray-200 text-gray-600"
					}`}
				>
					{index}
				</div>
				{index < TOTAL_STEPS && <div className="mx-2 h-0.5 w-6 bg-gray-200" />}
			</div>
		);
	};

	const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
		if (!canMoveToNext()) {
			event.preventDefault();
			return;
		}

		onSubmit(event);
	};

	useEffect(() => {
		contactForm.setValue("contactNumber", formState.contactNumber);
	}, [contactForm, formState.contactNumber]);

	useEffect(() => {
		contactForm.setValue("guardianContactNo", formState.guardianContactNo);
	}, [contactForm, formState.guardianContactNo]);

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

	return (
		<Form {...contactForm}>
			<form onSubmit={handleFormSubmit} className="space-y-4">
				{errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
				{stepError && <p className="text-sm text-red-600">{stepError}</p>}

				<div className="flex items-center justify-center overflow-x-auto pb-1">
					{Array.from({ length: TOTAL_STEPS }, (_, index) => (
						<StepDot key={index + 1} index={index + 1} />
					))}
				</div>

				<div className="rounded-md border border-gray-200 bg-gray-50 p-3">
					<p className="text-xs uppercase text-gray-500">SEQ (Auto-assigned)</p>
					<Input value={formState.seq} readOnly className="mt-2 bg-white" />
				</div>

				<div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
					<div>
						<p className="text-xs uppercase text-gray-500">
							Scholarship Encoding
						</p>
						<p className="text-sm font-semibold text-gray-900">
							Step {step} of {TOTAL_STEPS}
						</p>
					</div>
					<p className="text-xs text-gray-600">
						Complete the current step before proceeding.
					</p>
				</div>

				{step === 1 && (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<p className="sm:col-span-2 text-sm font-semibold text-gray-900">
							Step 1 - Student Information
						</p>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Last Name <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("lastName") ? "border-red-500" : undefined
								}
								value={formState.lastName}
								onChange={(event) =>
									updateField("lastName", event.target.value)
								}
								placeholder="Enter last name"
								required
							/>
							{getRequiredFieldMessage("lastName")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Given Name <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("givenName") ? "border-red-500" : undefined
								}
								value={formState.givenName}
								onChange={(event) =>
									updateField("givenName", event.target.value)
								}
								placeholder="Enter given name"
								required
							/>
							{getRequiredFieldMessage("givenName")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Middle Name <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("scholarshipMiddleName")
										? "border-red-500"
										: undefined
								}
								value={formState.scholarshipMiddleName}
								onChange={(event) =>
									updateField("scholarshipMiddleName", event.target.value)
								}
								placeholder="Enter middle name"
								required
							/>
							{getRequiredFieldMessage("scholarshipMiddleName")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Ext. Name
							</label>
							<Input
								value={formState.extName}
								onChange={(event) =>
									handleInputChange("extName", event.target.value)
								}
								placeholder="e.g. Jr., III"
							/>
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Sex <span className="text-red-500">*</span>
							</label>
							<Select
								value={formState.scholarshipSex}
								onValueChange={(value) => updateField("scholarshipSex", value)}
							>
								<SelectTrigger
									className={
										hasFieldError("scholarshipSex")
											? "border-red-500"
											: undefined
									}
								>
									<SelectValue placeholder="Select sex" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="male">Male</SelectItem>
									<SelectItem value="female">Female</SelectItem>
									<SelectItem value="prefer_not_to_say">
										Prefer not to say
									</SelectItem>
								</SelectContent>
							</Select>
							{getRequiredFieldMessage("scholarshipSex")}
						</div>
						<DatePickerField
							label="Birthdate *"
							date={formState.scholarshipBirthdate}
							onSelect={(date) => updateField("scholarshipBirthdate", date)}
							disabled={(date) => date > new Date()}
							error={hasFieldError("scholarshipBirthdate")}
						/>
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
										<div className="relative group">
											<Phone className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-[#a60202] transition-colors" />
											<Input
												{...field}
												type="tel"
												aria-invalid={
													fieldState.invalid || hasFieldError("contactNumber")
												}
												className={`pl-11 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#a60202] focus:ring-[#a60202]/20 rounded-xl transition-all ${
													hasFieldError("contactNumber") ? "border-red-500" : ""
												}`}
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
						<div>
							<label className="text-sm font-medium text-gray-700">
								Email Address{" "}
								<span className="font-normal text-gray-500">(optional)</span>
							</label>
							<Input
								type="email"
								value={formState.emailAddress}
								onChange={(event) =>
									handleInputChange("emailAddress", event.target.value)
								}
								placeholder="name@example.com"
								pattern="^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
								title="Enter a valid email address (e.g., name@example.com)."
							/>
						</div>
					</div>
				)}

				{step === 2 && (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<p className="sm:col-span-2 text-sm font-semibold text-gray-900">
							Step 2 - Academic Information
						</p>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Student ID <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("studentId") ? "border-red-500" : undefined
								}
								value={formState.studentId}
								onChange={(event) =>
									updateField("studentId", event.target.value)
								}
								placeholder="Enter student ID"
								required
							/>
							{getRequiredFieldMessage("studentId")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Complete Program Name <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("completeProgramName")
										? "border-red-500"
										: undefined
								}
								value={formState.completeProgramName}
								onChange={(event) =>
									updateField("completeProgramName", event.target.value)
								}
								placeholder="Enter complete program name"
								required
							/>
							{getRequiredFieldMessage("completeProgramName")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Year Level <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("yearLevel") ? "border-red-500" : undefined
								}
								value={formState.yearLevel}
								onChange={(event) =>
									updateField("yearLevel", event.target.value)
								}
								placeholder="Enter year level"
								required
							/>
							{getRequiredFieldMessage("yearLevel")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								HEI UII <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("heiUii") ? "border-red-500" : undefined
								}
								value={formState.heiUii}
								onChange={(event) => updateField("heiUii", event.target.value)}
								placeholder="Enter HEI UII"
								required
							/>
							{getRequiredFieldMessage("heiUii")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								HEI Name <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("heiName") ? "border-red-500" : undefined
								}
								value={formState.heiName}
								onChange={(event) => updateField("heiName", event.target.value)}
								placeholder="Enter HEI name"
								required
							/>
							{getRequiredFieldMessage("heiName")}
						</div>
					</div>
				)}

				{step === 3 && (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<p className="sm:col-span-2 text-sm font-semibold text-gray-900">
							Step 3 - Address Information
						</p>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Street & Barangay <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("streetBarangay") ? "border-red-500" : undefined
								}
								value={formState.streetBarangay}
								onChange={(event) =>
									updateField("streetBarangay", event.target.value)
								}
								placeholder="Enter street and barangay"
								required
							/>
							{getRequiredFieldMessage("streetBarangay")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Town/City/Municipality <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("townCityMunicipality")
										? "border-red-500"
										: undefined
								}
								value={formState.townCityMunicipality}
								onChange={(event) =>
									updateField("townCityMunicipality", event.target.value)
								}
								placeholder="Enter town/city/municipality"
								required
							/>
							{getRequiredFieldMessage("townCityMunicipality")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Province <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("province") ? "border-red-500" : undefined
								}
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
								className={
									hasFieldError("zipCode") ? "border-red-500" : undefined
								}
								value={formState.zipCode}
								onChange={(event) => updateField("zipCode", event.target.value)}
								placeholder="Enter ZIP code"
								required
							/>
							{getRequiredFieldMessage("zipCode")}
						</div>
					</div>
				)}

				{step === 4 && (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<p className="sm:col-span-2 text-sm font-semibold text-gray-900">
							Step 4 - Parent Information
						</p>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Father's Last Name <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("fatherLastName") ? "border-red-500" : undefined
								}
								value={formState.fatherLastName}
								onChange={(event) =>
									updateField("fatherLastName", event.target.value)
								}
								placeholder="Enter father's last name"
								required
							/>
							{getRequiredFieldMessage("fatherLastName")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Father's Given Name <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("fatherGivenName")
										? "border-red-500"
										: undefined
								}
								value={formState.fatherGivenName}
								onChange={(event) =>
									updateField("fatherGivenName", event.target.value)
								}
								placeholder="Enter father's given name"
								required
							/>
							{getRequiredFieldMessage("fatherGivenName")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Father's Middle Name <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("fatherMiddleName")
										? "border-red-500"
										: undefined
								}
								value={formState.fatherMiddleName}
								onChange={(event) =>
									updateField("fatherMiddleName", event.target.value)
								}
								placeholder="Enter father's middle name"
								required
							/>
							{getRequiredFieldMessage("fatherMiddleName")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Mother's Maiden Last Name{" "}
								<span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("motherMaidenLastName")
										? "border-red-500"
										: undefined
								}
								value={formState.motherMaidenLastName}
								onChange={(event) =>
									updateField("motherMaidenLastName", event.target.value)
								}
								placeholder="Enter mother's maiden last name"
								required
							/>
							{getRequiredFieldMessage("motherMaidenLastName")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Mother's Maiden Given Name{" "}
								<span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("motherMaidenGivenName")
										? "border-red-500"
										: undefined
								}
								value={formState.motherMaidenGivenName}
								onChange={(event) =>
									updateField("motherMaidenGivenName", event.target.value)
								}
								placeholder="Enter mother's maiden given name"
								required
							/>
							{getRequiredFieldMessage("motherMaidenGivenName")}
						</div>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Mother's Maiden Middle Name{" "}
								<span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("motherMaidenMiddleName")
										? "border-red-500"
										: undefined
								}
								value={formState.motherMaidenMiddleName}
								onChange={(event) =>
									updateField("motherMaidenMiddleName", event.target.value)
								}
								placeholder="Enter mother's maiden middle name"
								required
							/>
							{getRequiredFieldMessage("motherMaidenMiddleName")}
						</div>
					</div>
				)}

				{step === 5 && (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<p className="sm:col-span-2 text-sm font-semibold text-gray-900">
							Step 5 - Guardian Information
						</p>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Name of Guardian <span className="text-red-500">*</span>
							</label>
							<Input
								className={
									hasFieldError("guardianName") ? "border-red-500" : undefined
								}
								value={formState.guardianName}
								onChange={(event) =>
									updateField("guardianName", event.target.value)
								}
								placeholder="Enter guardian name"
								required
							/>
							{getRequiredFieldMessage("guardianName")}
						</div>
						<FormField
							control={contactForm.control}
							name="guardianContactNo"
							rules={{ validate: validatePhMobileInput }}
							render={({ field, fieldState }) => (
								<FormItem>
									<FormLabel className="text-gray-700 font-medium">
										Guardian Contact No. <span className="text-red-500">*</span>
									</FormLabel>
									<FormControl>
										<div className="relative group">
											<Phone className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-[#a60202] transition-colors" />
											<Input
												{...field}
												type="tel"
												aria-invalid={
													fieldState.invalid ||
													hasFieldError("guardianContactNo")
												}
												className={`pl-11 h-12 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-[#a60202] focus:ring-[#a60202]/20 rounded-xl transition-all ${
													hasFieldError("guardianContactNo")
														? "border-red-500"
														: ""
												}`}
												value={field.value ?? ""}
												onChange={(event) => {
													field.onChange(event.target.value);
													updateField("guardianContactNo", event.target.value);
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
									{getRequiredFieldMessage("guardianContactNo")}
								</FormItem>
							)}
						/>
						<div>
							<label className="text-sm font-medium text-gray-700">
								Guardian Email Address{" "}
								<span className="font-normal text-gray-500">(optional)</span>
							</label>
							<Input
								type="email"
								value={formState.guardianEmailAddress}
								onChange={(event) =>
									handleInputChange("guardianEmailAddress", event.target.value)
								}
								placeholder="guardian@example.com"
								pattern="^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
								title="Enter a valid email address (e.g., guardian@example.com)."
							/>
						</div>
					</div>
				)}

				<DialogFooter className="flex w-full items-center justify-between sm:justify-between">
					<div>
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
					<div className="flex items-center gap-2">
						<Button type="button" variant="ghost" onClick={onCancel}>
							Cancel
						</Button>
						{step < TOTAL_STEPS ? (
							<Button
								type="button"
								onClick={() => {
									if (!canMoveToNext()) return;
									setStep((prev) => prev + 1);
								}}
							>
								Next
							</Button>
						) : (
							<Button type="submit">Submit</Button>
						)}
					</div>
				</DialogFooter>
			</form>
		</Form>
	);
}
