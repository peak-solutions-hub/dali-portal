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
		const barangay = input.barangay.trim();
		const cityMunicipality = input.cityMunicipality.trim();
		const province = input.province.trim();
		const reasonForVisitAffiliation = input.reasonForVisitAffiliation.trim();
		const middleInitial = input.middleInitial?.trim() || null;

		const household = await this.db.household.create({
			data: {
				streetAndBarangay: `${barangay}, ${province}`,
				town: cityMunicipality,
				lastAidDate: new Date(),
			},
		});

		const constituent = await this.db.constituent.create({
			data: {
				householdId: household.id,
				firstName: input.firstName.trim(),
				lastName: input.familyName.trim(),
				extName: middleInitial,
				contactNumber: input.contactNumber.trim(),
				sex: "male",
			},
		});

		const visitorLog = await this.db.visitorLog.create({
			data: {
				constituentId: constituent.id,
				company: null,
				dateVisited: new Date(),
				purpose: reasonForVisitAffiliation,
				remarks: null,
			},
		});

		return { id: visitorLog.id };
	}

	async list(
		role: RoleType,
		loggedByName: string,
	): Promise<VisitorLogListResponse> {
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

		const beneficiaryConstituents = await this.db.constituent.findMany({
			where: {
				OR: [
					{ assistanceRecord: { some: {} } },
					{ scholarshipApplication: { some: {} } },
				],
			},
			include: {
				household: true,
				assistanceRecord: {
					orderBy: { createdAt: "desc" },
				},
				scholarshipApplication: true,
			},
		});

		const manualRows: VisitorLogListResponse = visitorLogs.map((log) => ({
			id: log.id,
			dateVisited: log.dateVisited.toISOString(),
			constituentName:
				`${log.constituent.firstName} ${log.constituent.lastName}`.trim(),
			purposeAffiliation: log.purpose,
			loggedBy: loggedByName || ROLE_DISPLAY_NAMES[role],
		}));

		const derivedRows: VisitorLogListResponse = [];
		for (const constituent of beneficiaryConstituents) {
			for (const assistance of constituent.assistanceRecord) {
				derivedRows.push({
					id: `assistance-${assistance.id}`,
					dateVisited: assistance.createdAt.toISOString(),
					constituentName:
						`${constituent.firstName} ${constituent.lastName}`.trim(),
					purposeAffiliation: assistance.type,
					loggedBy: loggedByName || ROLE_DISPLAY_NAMES[role],
				});
			}

			if (constituent.scholarshipApplication.length > 0) {
				derivedRows.push({
					id: `scholarship-${constituent.id}`,
					dateVisited: constituent.household.lastAidDate.toISOString(),
					constituentName:
						`${constituent.firstName} ${constituent.lastName}`.trim(),
					purposeAffiliation: "Request for Scholarship",
					loggedBy: loggedByName || ROLE_DISPLAY_NAMES[role],
				});
			}
		}

		return [...manualRows, ...derivedRows].sort(
			(a, b) =>
				new Date(b.dateVisited).getTime() - new Date(a.dateVisited).getTime(),
		);
	}
}
