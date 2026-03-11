import { Injectable } from "@nestjs/common";
import {
	type CreateVisitorLogInput,
	type CreateVisitorLogResponse,
	ROLE_DISPLAY_NAMES,
	type RoleType,
	type VisitorLogListResponse,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";

@Injectable()
export class VisitorLogService {
	constructor(private readonly db: DbService) {}

	async create(
		input: CreateVisitorLogInput,
	): Promise<CreateVisitorLogResponse> {
		const affiliation = input.affiliation?.trim() || null;
		const remarks = input.remarks?.trim() || null;

		const household = await this.db.household.create({
			data: {
				streetAndBarangay: affiliation ?? "Not provided",
				town: "Iloilo City",
				lastAidDate: new Date(),
			},
		});

		const constituent = await this.db.constituent.create({
			data: {
				householdId: household.id,
				firstName: input.firstName.trim(),
				lastName: input.familyName.trim(),
				extName: null,
				contactNumber: input.contactNumber.trim(),
				sex: "male",
			},
		});

		const visitorLog = await this.db.visitorLog.create({
			data: {
				constituentId: constituent.id,
				company: affiliation,
				dateVisited: new Date(),
				purpose: input.purpose.trim(),
				remarks,
			},
		});

		return { id: visitorLog.id };
	}

	async list(role: RoleType): Promise<VisitorLogListResponse> {
		const visitorLogs = await this.db.visitorLog.findMany({
			orderBy: { dateVisited: "desc" },
			include: {
				constituent: {
					include: {
						household: true,
					},
				},
			},
		});

		return visitorLogs.map((log) => ({
			id: log.id,
			dateVisited: log.dateVisited.toISOString(),
			constituentName:
				`${log.constituent.firstName} ${log.constituent.lastName}`.trim(),
			purpose: log.purpose,
			affiliation: log.company ?? log.constituent.household.streetAndBarangay,
			remarks: log.remarks,
			loggedBy: ROLE_DISPLAY_NAMES[role],
		}));
	}
}
