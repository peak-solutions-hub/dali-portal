import { Injectable } from "@nestjs/common";
import {
	AppError,
	type CreateAssistanceRecordInput,
	type CreateAssistanceRecordResponse,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";

@Injectable()
export class AssistanceRecordService {
	constructor(private readonly db: DbService) {}

	private toFullName(
		lastName?: string,
		givenName?: string,
		middleName?: string,
	): string {
		return [givenName, middleName, lastName]
			.map((part) => part?.trim() ?? "")
			.filter((part) => part !== "")
			.join(" ");
	}

	async create(
		input: CreateAssistanceRecordInput,
	): Promise<CreateAssistanceRecordResponse> {
		const isBurial = input.purpose === "Burial Assistance";

		const patientFullName = this.toFullName(
			input.patientLastName,
			input.patientGivenName,
			input.patientMiddleName,
		);
		const deceasedFullName = this.toFullName(
			input.deceasedLastName,
			input.deceasedGivenName,
			input.deceasedMiddleName,
		);

		if (isBurial && !deceasedFullName) {
			throw new AppError(
				"GENERAL.BAD_REQUEST",
				"Deceased name is required for burial assistance.",
			);
		}

		if (!isBurial && !patientFullName) {
			throw new AppError(
				"GENERAL.BAD_REQUEST",
				"Patient name is required for this assistance type.",
			);
		}

		const burialDate = input.burialDate ? new Date(input.burialDate) : null;
		if (input.burialDate && burialDate && Number.isNaN(burialDate.getTime())) {
			throw new AppError("GENERAL.BAD_REQUEST", "Invalid burial date.");
		}

		const claimantLastName = input.claimantLastName.trim();
		const claimantGivenName = input.claimantGivenName.trim();
		const claimantMiddleName = input.claimantMiddleName.trim();

		const household = await this.db.household.create({
			data: {
				streetAndBarangay: `${input.street.trim()}, ${input.subdivisionVillage.trim()}, ${input.barangay.trim()}, ${input.province.trim()} ${input.zipCode.trim()}`,
				town: input.cityMunicipality.trim(),
				lastAidDate: new Date(),
			},
		});

		let constituent = await this.db.constituent.findFirst({
			where: {
				firstName: claimantGivenName,
				lastName: claimantLastName,
				contactNumber: input.contactNumber.trim(),
			},
		});

		if (!constituent) {
			constituent = await this.db.constituent.create({
				data: {
					householdId: household.id,
					firstName: claimantGivenName,
					lastName: claimantLastName,
					extName: claimantMiddleName || null,
					contactNumber: input.contactNumber.trim(),
					sex: "male",
				},
			});
		}

		const assistanceRecord = await this.db.assistanceRecord.create({
			data: {
				claimantId: constituent.id,
				patientName: isBurial ? deceasedFullName : patientFullName,
				type: input.purpose.trim(),
				amountNeeded: 0,
				approvedAmount: 0,
				referredBy: JSON.stringify({
					claimantLastName,
					claimantGivenName,
					claimantMiddleName,
					patientLastName: input.patientLastName?.trim() ?? "",
					patientGivenName: input.patientGivenName?.trim() ?? "",
					patientMiddleName: input.patientMiddleName?.trim() ?? "",
					deceasedLastName: input.deceasedLastName?.trim() ?? "",
					deceasedGivenName: input.deceasedGivenName?.trim() ?? "",
					deceasedMiddleName: input.deceasedMiddleName?.trim() ?? "",
					street: input.street.trim(),
					subdivisionVillage: input.subdivisionVillage.trim(),
					barangay: input.barangay.trim(),
					cityMunicipality: input.cityMunicipality.trim(),
					province: input.province.trim(),
					zipCode: input.zipCode.trim(),
					burialDate: input.burialDate ?? "",
				}),
				endorsementDate: burialDate ?? new Date(),
			},
		});

		return { id: assistanceRecord.id };
	}
}
