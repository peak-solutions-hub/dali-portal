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

	private parseAmount(value: string): number {
		const normalized = value.replace(/[^0-9.]/g, "");
		const parsed = Number.parseFloat(normalized);
		return Number.isFinite(parsed) ? parsed : 0;
	}

	async create(
		input: CreateAssistanceRecordInput,
	): Promise<CreateAssistanceRecordResponse> {
		const endorsementDate = new Date(input.endorsementDate);
		if (Number.isNaN(endorsementDate.getTime())) {
			throw new AppError("GENERAL.BAD_REQUEST", "Invalid endorsement date.");
		}

		const household = await this.db.household.create({
			data: {
				streetAndBarangay: input.streetBarangay.trim(),
				town: "Iloilo City",
				lastAidDate: new Date(),
			},
		});

		let constituent = await this.db.constituent.findFirst({
			where: {
				firstName: input.firstName.trim(),
				lastName: input.familyName.trim(),
				contactNumber: input.contactNumber.trim(),
			},
		});

		if (!constituent) {
			constituent = await this.db.constituent.create({
				data: {
					householdId: household.id,
					firstName: input.firstName.trim(),
					lastName: input.familyName.trim(),
					extName: null,
					contactNumber: input.contactNumber.trim(),
					sex: "male",
				},
			});
		}

		const assistanceRecord = await this.db.assistanceRecord.create({
			data: {
				claimantId: constituent.id,
				patientName: input.firstName.trim(),
				type: input.purpose.trim(),
				amountNeeded: this.parseAmount(input.hospitalName),
				approvedAmount: this.parseAmount(input.medicineName),
				referredBy: input.givenName.trim(),
				endorsementDate,
			},
		});

		return { id: assistanceRecord.id };
	}
}
