import { Injectable } from "@nestjs/common";
import {
	AppError,
	type BeneficiaryListResponse,
	type BeneficiaryResponse,
} from "@repo/shared";
import { DbService } from "@/app/db/db.service";
import type { Prisma } from "@/generated/prisma/client";

type ConstituentWithRelations = Prisma.ConstituentGetPayload<{
	include: {
		household: true;
		visitorLog: true;
		assistanceRecord: true;
		scholarshipApplication: true;
	};
}>;

@Injectable()
export class BeneficiaryService {
	constructor(private readonly db: DbService) {}

	private mapSex(value: string): string {
		if (value === "male") return "Male";
		if (value === "female") return "Female";
		return value;
	}

	private mapConstituentToResponse(
		constituent: ConstituentWithRelations,
	): BeneficiaryResponse {
		const assistanceDetails: Record<string, Record<string, string>> = {};

		for (const record of constituent.assistanceRecord) {
			const type = record.type || "Assistance Request";
			if (!assistanceDetails[type]) {
				assistanceDetails[type] = {};
			}
			assistanceDetails[type] = {
				...assistanceDetails[type],
				laboratoryType: type.toLowerCase().includes("laboratory")
					? record.patientName
					: assistanceDetails[type].laboratoryType || "",
				hospitalName: type.toLowerCase().includes("hospital")
					? record.patientName
					: assistanceDetails[type].hospitalName || "",
				medicineName: type.toLowerCase().includes("medicine")
					? record.patientName
					: assistanceDetails[type].medicineName || "",
				deceasedName: type.toLowerCase().includes("burial")
					? record.patientName
					: assistanceDetails[type].deceasedName || "",
				relationToDeceased: type.toLowerCase().includes("burial")
					? record.referredBy
					: assistanceDetails[type].relationToDeceased || "",
			};
		}

		const latestScholarship = [...constituent.scholarshipApplication].sort(
			(a, b) => Number(b.id) - Number(a.id),
		)[0];
		if (latestScholarship) {
			assistanceDetails["Scholarship Grant"] = {
				seq: latestScholarship.seqNumber.toString(),
				studentId: latestScholarship.studentId,
				lastName: constituent.lastName,
				givenName: constituent.firstName,
				extName: constituent.extName ?? "",
				scholarshipMiddleName: latestScholarship.middleName,
				scholarshipSex: constituent.sex,
				scholarshipBirthdate: latestScholarship.birthDate.toISOString(),
				contactNumber: constituent.contactNumber,
				emailAddress: latestScholarship.guardianEmailAddress,
				completeProgramName: latestScholarship.programName,
				yearLevel: latestScholarship.yearLevel,
				heiUii: latestScholarship.heiUii,
				heiName: latestScholarship.heiName,
				streetBarangay: constituent.household.streetAndBarangay,
				townCityMunicipality: constituent.household.town,
				province: latestScholarship.province,
				zipCode: latestScholarship.zipCode.toString(),
				fatherLastName: latestScholarship.fatherLastName,
				fatherGivenName: latestScholarship.fatherGivenName,
				fatherMiddleName: latestScholarship.fatherMiddleName,
				motherMaidenLastName: latestScholarship.motherLastName,
				motherMaidenGivenName: latestScholarship.motherGivenName,
				motherMaidenMiddleName: latestScholarship.motherMiddleName,
				guardianName: "",
				guardianContactNo: latestScholarship.guardianContactNumber,
				guardianEmailAddress: latestScholarship.guardianEmailAddress,
			};
		}

		const latestDate =
			constituent.visitorLog[0]?.dateVisited ??
			constituent.assistanceRecord[0]?.createdAt ??
			new Date();
		const defaultAssistanceType =
			constituent.assistanceRecord[0]?.type ??
			(latestScholarship ? "Scholarship Grant" : "Assistance Request");

		const visits = constituent.visitorLog.map((visit) => ({
			id: visit.id,
			date: visit.dateVisited.toISOString(),
			title: "Walk-in Visit",
			assistanceType: defaultAssistanceType,
			notes: visit.remarks ?? "",
			assistanceDetails: assistanceDetails[defaultAssistanceType] ?? {},
		}));

		return {
			id: constituent.id,
			name: `${constituent.firstName} ${constituent.lastName}`.trim(),
			municipality: constituent.household.town,
			barangay: constituent.household.streetAndBarangay,
			sex: this.mapSex(constituent.sex),
			civilStatus: "Unspecified",
			age: "--",
			phoneNumber: constituent.contactNumber,
			email: latestScholarship?.guardianEmailAddress ?? "",
			purpose: defaultAssistanceType,
			createdAt: latestDate.toISOString(),
			visits,
			assistanceDetails,
		};
	}

	async list(): Promise<BeneficiaryListResponse> {
		const constituents = await this.db.constituent.findMany({
			where: {
				OR: [
					{ assistanceRecord: { some: {} } },
					{ scholarshipApplication: { some: {} } },
				],
			},
			include: {
				household: true,
				visitorLog: {
					orderBy: { dateVisited: "desc" },
				},
				assistanceRecord: {
					orderBy: { createdAt: "desc" },
				},
				scholarshipApplication: true,
			},
		});

		return constituents.map((constituent) =>
			this.mapConstituentToResponse(constituent),
		);
	}

	async getById(id: string): Promise<BeneficiaryResponse> {
		const constituent = await this.db.constituent.findFirst({
			where: {
				id,
				OR: [
					{ assistanceRecord: { some: {} } },
					{ scholarshipApplication: { some: {} } },
				],
			},
			include: {
				household: true,
				visitorLog: {
					orderBy: { dateVisited: "desc" },
				},
				assistanceRecord: {
					orderBy: { createdAt: "desc" },
				},
				scholarshipApplication: true,
			},
		});

		if (!constituent) {
			throw new AppError("GENERAL.NOT_FOUND");
		}

		return this.mapConstituentToResponse(constituent);
	}
}
