import { Injectable } from "@nestjs/common";
import {
	AppError,
	type CreateAssistanceRecordInput,
	type CreateAssistanceRecordResponse,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";

type DuplicatePersonCheckInput = {
	purpose: string;
	patientLastName?: string;
	patientGivenName?: string;
	patientMiddleName?: string;
	deceasedLastName?: string;
	deceasedGivenName?: string;
	deceasedMiddleName?: string;
};

type DuplicatePersonCheckResponse = {
	matches: Array<{
		id: string;
		assistanceType: string;
		claimantName: string;
		personName: string;
		matchedAs: "patient" | "deceased";
		createdAt: string;
	}>;
};

@Injectable()
export class AssistanceRecordService {
	constructor(private readonly db: DbService) {}

	private normalizeName(value: string): string {
		return value
			.toLowerCase()
			.replace(/[^\p{L}\p{N}\s]/gu, " ")
			.replace(/\s+/g, " ")
			.trim();
	}

	private parseAssistanceMeta(raw: string): {
		claimantLastName: string;
		claimantGivenName: string;
		claimantMiddleName: string;
		patientLastName: string;
		patientGivenName: string;
		patientMiddleName: string;
		deceasedLastName: string;
		deceasedGivenName: string;
		deceasedMiddleName: string;
	} {
		if (!raw.trim()) {
			return {
				claimantLastName: "",
				claimantGivenName: "",
				claimantMiddleName: "",
				patientLastName: "",
				patientGivenName: "",
				patientMiddleName: "",
				deceasedLastName: "",
				deceasedGivenName: "",
				deceasedMiddleName: "",
			};
		}

		try {
			const parsed = JSON.parse(raw) as Record<string, unknown>;
			return {
				claimantLastName:
					typeof parsed.claimantLastName === "string"
						? parsed.claimantLastName
						: "",
				claimantGivenName:
					typeof parsed.claimantGivenName === "string"
						? parsed.claimantGivenName
						: "",
				claimantMiddleName:
					typeof parsed.claimantMiddleName === "string"
						? parsed.claimantMiddleName
						: "",
				patientLastName:
					typeof parsed.patientLastName === "string"
						? parsed.patientLastName
						: "",
				patientGivenName:
					typeof parsed.patientGivenName === "string"
						? parsed.patientGivenName
						: "",
				patientMiddleName:
					typeof parsed.patientMiddleName === "string"
						? parsed.patientMiddleName
						: "",
				deceasedLastName:
					typeof parsed.deceasedLastName === "string"
						? parsed.deceasedLastName
						: "",
				deceasedGivenName:
					typeof parsed.deceasedGivenName === "string"
						? parsed.deceasedGivenName
						: "",
				deceasedMiddleName:
					typeof parsed.deceasedMiddleName === "string"
						? parsed.deceasedMiddleName
						: "",
			};
		} catch {
			return {
				claimantLastName: "",
				claimantGivenName: "",
				claimantMiddleName: "",
				patientLastName: "",
				patientGivenName: "",
				patientMiddleName: "",
				deceasedLastName: "",
				deceasedGivenName: "",
				deceasedMiddleName: "",
			};
		}
	}

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

	async checkDuplicatePerson(
		input: unknown,
	): Promise<DuplicatePersonCheckResponse> {
		const payload = input as DuplicatePersonCheckInput;
		const isBurial = payload.purpose.trim() === "Burial Assistance";

		const targetPersonName = isBurial
			? this.toFullName(
					payload.deceasedLastName,
					payload.deceasedGivenName,
					payload.deceasedMiddleName,
				)
			: this.toFullName(
					payload.patientLastName,
					payload.patientGivenName,
					payload.patientMiddleName,
				);

		const normalizedTarget = this.normalizeName(targetPersonName);
		if (!normalizedTarget) {
			throw new AppError(
				"GENERAL.BAD_REQUEST",
				isBurial
					? "Deceased name is required for duplicate checking."
					: "Patient name is required for duplicate checking.",
			);
		}

		const records = await this.db.assistanceRecord.findMany({
			orderBy: {
				createdAt: "desc",
			},
		});

		const matches = records
			.flatMap((record) => {
				const metadata = this.parseAssistanceMeta(record.referredBy);
				const personName = isBurial
					? this.toFullName(
							metadata.deceasedLastName,
							metadata.deceasedGivenName,
							metadata.deceasedMiddleName,
						) || record.patientName
					: this.toFullName(
							metadata.patientLastName,
							metadata.patientGivenName,
							metadata.patientMiddleName,
						) || record.patientName;

				if (this.normalizeName(personName) !== normalizedTarget) {
					return [];
				}

				return [
					{
						id: record.id,
						assistanceType: record.type,
						claimantName:
							this.toFullName(
								metadata.claimantLastName,
								metadata.claimantGivenName,
								metadata.claimantMiddleName,
							) || "Unknown claimant",
						personName,
						matchedAs: isBurial ? ("deceased" as const) : ("patient" as const),
						createdAt: record.createdAt.toISOString(),
					},
				];
			})
			.filter((match) => match.personName.trim() !== "");

		return { matches };
	}
}
