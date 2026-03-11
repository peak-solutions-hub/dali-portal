import { Injectable } from "@nestjs/common";
import {
	AppError,
	type CreateScholarshipApplicationInput,
	type CreateScholarshipApplicationResponse,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";

@Injectable()
export class ScholarshipApplicationService {
	constructor(private readonly db: DbService) {}

	private parseRequiredNumber(value: string, label: string): number {
		const parsed = Number.parseFloat(value);
		if (!Number.isFinite(parsed)) {
			throw new AppError(
				"GENERAL.BAD_REQUEST",
				`${label} must be a valid number.`,
			);
		}
		return parsed;
	}

	private mapSex(
		value: CreateScholarshipApplicationInput["scholarshipSex"],
	): "male" | "female" {
		if (value === "male" || value === "female") {
			return value;
		}

		throw new AppError(
			"GENERAL.BAD_REQUEST",
			"Scholarship sex must be male or female.",
		);
	}

	async create(
		input: CreateScholarshipApplicationInput,
	): Promise<CreateScholarshipApplicationResponse> {
		const birthDate = new Date(input.scholarshipBirthdate);
		if (Number.isNaN(birthDate.getTime())) {
			throw new AppError(
				"GENERAL.BAD_REQUEST",
				"Invalid scholarship birthdate.",
			);
		}

		const household = await this.db.household.create({
			data: {
				streetAndBarangay: input.streetBarangay.trim(),
				town: input.townCityMunicipality.trim(),
				lastAidDate: new Date(),
			},
		});

		let constituent = await this.db.constituent.findFirst({
			where: {
				firstName: input.givenName.trim(),
				lastName: input.lastName.trim(),
				contactNumber: input.contactNumber.trim(),
			},
		});

		if (!constituent) {
			constituent = await this.db.constituent.create({
				data: {
					householdId: household.id,
					firstName: input.givenName.trim(),
					lastName: input.lastName.trim(),
					extName: input.extName?.trim() || null,
					contactNumber: input.contactNumber.trim(),
					sex: this.mapSex(input.scholarshipSex),
				},
			});
		}

		const scholarship = await this.db.scholarshipApplication.create({
			data: {
				constituentId: constituent.id,
				seqNumber: this.parseRequiredNumber(input.seq, "SEQ"),
				studentId: input.studentId.trim(),
				middleName: input.scholarshipMiddleName.trim(),
				birthDate,
				programName: input.completeProgramName.trim(),
				yearLevel: input.yearLevel.trim(),
				province: input.province.trim(),
				zipCode: this.parseRequiredNumber(input.zipCode, "ZIP code"),
				heiUii: input.heiUii.trim(),
				heiName: input.heiName.trim(),
				fatherLastName: input.fatherLastName.trim(),
				fatherMiddleName: input.fatherMiddleName.trim(),
				fatherGivenName: input.fatherGivenName.trim(),
				motherMiddleName: input.motherMaidenMiddleName.trim(),
				motherLastName: input.motherMaidenLastName.trim(),
				motherGivenName: input.motherMaidenGivenName.trim(),
				guardianContactNumber: input.guardianContactNo.trim(),
				guardianEmailAddress: input.guardianEmailAddress?.trim() || "",
			},
		});

		return { id: scholarship.id.toString() };
	}
}
