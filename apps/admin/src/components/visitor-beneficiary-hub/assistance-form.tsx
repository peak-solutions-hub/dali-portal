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
import { useEffect, useState } from "react";
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
	assistanceDate: "Date",
	firstName: "Name of Patient",
	familyName: "Name of Claimant",
	streetBarangay: "Address",
	contactNumber: "Contact No.",
	hospitalName: "Amount Needed",
	medicineName: "Approved Amount",
	givenName: "Referred By",
	endorsementDate: "Endorsement Date",
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
	const contactForm = useForm<{ contactNumber: string }>({
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues: { contactNumber: formState.contactNumber },
	});

	const REQUIRED_FIELDS: Array<keyof MainFormState> = [
		"purpose",
		"assistanceDate",
		"firstName",
		"familyName",
		"streetBarangay",
		"contactNumber",
		"hospitalName",
		"medicineName",
		"givenName",
		"endorsementDate",
	];

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
		missingFields.includes(field);

	const validateForm = () => {
		const fieldsWithMissingValue = REQUIRED_FIELDS.filter((field) =>
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

	const hasStrictContactError =
		formState.contactNumber.trim() !== "" &&
		!isStrictPhMobile(formState.contactNumber);

	return (
		<Form {...contactForm}>
			<form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
				{errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

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

				<div className="rounded-md border border-gray-200 bg-gray-50 p-3">
					<p className="text-xs uppercase text-gray-500">NO. (Auto-assigned)</p>
					<Input value={formState.seq} readOnly className="mt-2 bg-white" />
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<DatePickerField
						label="Date *"
						date={formState.assistanceDate}
						onSelect={(date) => updateField("assistanceDate", date)}
						error={hasFieldError("assistanceDate")}
						showIcon={false}
					/>
					<div>
						<label className="text-sm font-medium text-gray-700">
							Name of Patient <span className="text-red-500">*</span>
						</label>
						<Input
							className={getInputClassName(hasFieldError("firstName"))}
							value={formState.firstName}
							onChange={(event) => updateField("firstName", event.target.value)}
							placeholder="Enter patient name"
							required
						/>
						{getRequiredFieldMessage("firstName")}
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">
							Name of Claimant <span className="text-red-500">*</span>
						</label>
						<Input
							className={getInputClassName(hasFieldError("familyName"))}
							value={formState.familyName}
							onChange={(event) =>
								updateField("familyName", event.target.value)
							}
							placeholder="Enter claimant name"
							required
						/>
						{getRequiredFieldMessage("familyName")}
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">
							Address <span className="text-red-500">*</span>
						</label>
						<Input
							className={getInputClassName(hasFieldError("streetBarangay"))}
							value={formState.streetBarangay}
							onChange={(event) =>
								updateField("streetBarangay", event.target.value)
							}
							placeholder="Enter address"
							required
						/>
						{getRequiredFieldMessage("streetBarangay")}
					</div>
					<FormField
						control={contactForm.control}
						name="contactNumber"
						rules={{ validate: validatePhMobileInput }}
						render={({ field, fieldState }) => (
							<FormItem>
								<FormLabel className="text-gray-700 font-medium">
									Contact No. <span className="text-red-500">*</span>
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
					<div>
						<label className="text-sm font-medium text-gray-700">
							Amount Needed <span className="text-red-500">*</span>
						</label>
						<Input
							className={getInputClassName(hasFieldError("hospitalName"))}
							value={formState.hospitalName}
							onChange={(event) =>
								updateField("hospitalName", event.target.value)
							}
							placeholder="Enter amount needed"
							required
						/>
						{getRequiredFieldMessage("hospitalName")}
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">
							Approved Amount <span className="text-red-500">*</span>
						</label>
						<Input
							className={getInputClassName(hasFieldError("medicineName"))}
							value={formState.medicineName}
							onChange={(event) =>
								updateField("medicineName", event.target.value)
							}
							placeholder="Enter approved amount"
							required
						/>
						{getRequiredFieldMessage("medicineName")}
					</div>
					<div>
						<label className="text-sm font-medium text-gray-700">
							Referred By <span className="text-red-500">*</span>
						</label>
						<Input
							className={getInputClassName(hasFieldError("givenName"))}
							value={formState.givenName}
							onChange={(event) => updateField("givenName", event.target.value)}
							placeholder="Enter referrer name"
							required
						/>
						{getRequiredFieldMessage("givenName")}
					</div>
					<DatePickerField
						label="Endorsement Date *"
						date={formState.endorsementDate}
						onSelect={(date) => updateField("endorsementDate", date)}
						error={hasFieldError("endorsementDate")}
						showIcon={false}
					/>
				</div>

				<DialogFooter>
					<Button type="button" variant="ghost" onClick={onCancel}>
						Cancel
					</Button>
					<Button type="submit">Submit</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
