import { Button } from "@repo/ui/components/button";
import { DialogFooter } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import type { FormEvent } from "react";
import { useState } from "react";
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

export function AssistanceForm({
	formState,
	errorMessage,
	handleInputChange,
	onSubmit,
	onCancel,
}: AssistanceFormProps) {
	const REQUIRED_FIELDS: Array<keyof MainFormState> = [
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

		return <p className="mt-1 text-xs text-red-600">This field is required.</p>;
	};

	const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
		if (!validateForm()) {
			event.preventDefault();
			return;
		}

		onSubmit(event);
	};

	return (
		<form onSubmit={handleFormSubmit} className="space-y-4">
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
						className={hasFieldError("purpose") ? "border-red-500" : undefined}
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
				/>
				<div>
					<label className="text-sm font-medium text-gray-700">
						Name of Patient <span className="text-red-500">*</span>
					</label>
					<Input
						className={
							hasFieldError("firstName") ? "border-red-500" : undefined
						}
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
						className={
							hasFieldError("familyName") ? "border-red-500" : undefined
						}
						value={formState.familyName}
						onChange={(event) => updateField("familyName", event.target.value)}
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
						className={
							hasFieldError("streetBarangay") ? "border-red-500" : undefined
						}
						value={formState.streetBarangay}
						onChange={(event) =>
							updateField("streetBarangay", event.target.value)
						}
						placeholder="Enter address"
						required
					/>
					{getRequiredFieldMessage("streetBarangay")}
				</div>
				<div>
					<label className="text-sm font-medium text-gray-700">
						Contact No. <span className="text-red-500">*</span>
					</label>
					<div
						className={`flex items-center overflow-hidden rounded-md border bg-transparent shadow-xs ${
							hasFieldError("contactNumber") ? "border-red-500" : "border-input"
						}`}
					>
						<span className="border-r bg-muted px-3 py-2 text-sm text-muted-foreground">
							+63
						</span>
						<Input
							className="border-0 shadow-none focus-visible:ring-0"
							type="tel"
							value={formState.contactNumber}
							onChange={(event) =>
								updateField(
									"contactNumber",
									event.target.value.replace(/\D/g, "").slice(0, 10),
								)
							}
							placeholder="9XXXXXXXXX"
							inputMode="numeric"
							pattern="9[0-9]{9}"
							maxLength={10}
							autoComplete="tel-national"
							title="Enter a valid Philippine mobile number (e.g., 9XXXXXXXXX)."
							required
						/>
					</div>
					{getRequiredFieldMessage("contactNumber")}
				</div>
				<div>
					<label className="text-sm font-medium text-gray-700">
						Assistance Needed <span className="text-red-500">*</span>
					</label>
					<Input
						className={
							hasFieldError("laboratoryType") ? "border-red-500" : undefined
						}
						value={formState.laboratoryType}
						onChange={(event) =>
							updateField("laboratoryType", event.target.value)
						}
						placeholder="Enter assistance needed"
						required
					/>
					{getRequiredFieldMessage("laboratoryType")}
				</div>
				<div>
					<label className="text-sm font-medium text-gray-700">
						Amount Needed <span className="text-red-500">*</span>
					</label>
					<Input
						className={
							hasFieldError("hospitalName") ? "border-red-500" : undefined
						}
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
						className={
							hasFieldError("medicineName") ? "border-red-500" : undefined
						}
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
						className={
							hasFieldError("givenName") ? "border-red-500" : undefined
						}
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
				/>
			</div>

			<DialogFooter>
				<Button type="button" variant="ghost" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit">Submit</Button>
			</DialogFooter>
		</form>
	);
}
