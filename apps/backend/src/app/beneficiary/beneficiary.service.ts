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
		assistanceRecord: true;
		scholarshipApplication: true;
	};
}>;

@Injectable()
export class BeneficiaryService {
	constructor(private readonly db: DbService) {}

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
		street: string;
		subdivisionVillage: string;
		barangay: string;
		cityMunicipality: string;
		province: string;
		zipCode: string;
		burialDate: string;
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
				street: "",
				subdivisionVillage: "",
				barangay: "",
				cityMunicipality: "",
				province: "",
				zipCode: "",
				burialDate: "",
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
				street: typeof parsed.street === "string" ? parsed.street : "",
				subdivisionVillage:
					typeof parsed.subdivisionVillage === "string"
						? parsed.subdivisionVillage
						: "",
				barangay: typeof parsed.barangay === "string" ? parsed.barangay : "",
				cityMunicipality:
					typeof parsed.cityMunicipality === "string"
						? parsed.cityMunicipality
						: "",
				province: typeof parsed.province === "string" ? parsed.province : "",
				zipCode: typeof parsed.zipCode === "string" ? parsed.zipCode : "",
				burialDate:
					typeof parsed.burialDate === "string" ? parsed.burialDate : "",
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
				street: "",
				subdivisionVillage: "",
				barangay: "",
				cityMunicipality: "",
				province: "",
				zipCode: "",
				burialDate: "",
			};
		}
	}

	private mapSex(value: string): string {
		if (value === "male") return "Male";
		if (value === "female") return "Female";
		return value;
	}

	private mapConstituentToResponse(
		constituent: ConstituentWithRelations,
	): BeneficiaryResponse {
		const assistanceDetails: Record<string, Record<string, string>> = {};
		const householdSegments = constituent.household.streetAndBarangay
			.split(",")
			.map((segment) => segment.trim())
			.filter((segment) => segment !== "");
		const legacyStreet =
			householdSegments[0] ?? constituent.household.streetAndBarangay;
		const legacyBarangay = householdSegments[2] ?? householdSegments[1] ?? "";
		const legacyProvinceZip = householdSegments[3] ?? "";
		const legacyZipMatch = legacyProvinceZip.match(/(\d{4,})$/);
		const legacyZipCode = legacyZipMatch?.[1] ?? "";
		const legacyProvince = legacyProvinceZip.replace(/\s*\d{4,}$/, "").trim();

		for (const record of constituent.assistanceRecord) {
			const type = record.type || "Assistance Request";
			if (!assistanceDetails[type]) {
				assistanceDetails[type] = {};
			}

			const isBurial = type.toLowerCase().includes("burial");
			const metadata = this.parseAssistanceMeta(record.referredBy);
			assistanceDetails[type] = {
				...assistanceDetails[type],
				claimantLastName:
					metadata.claimantLastName || constituent.lastName || "",
				claimantGivenName:
					metadata.claimantGivenName || constituent.firstName || "",
				claimantMiddleName:
					metadata.claimantMiddleName || constituent.extName || "",
				patientLastName: metadata.patientLastName || "",
				patientGivenName: metadata.patientGivenName || "",
				patientMiddleName: metadata.patientMiddleName || "",
				deceasedLastName:
					metadata.deceasedLastName || (isBurial ? record.patientName : ""),
				deceasedGivenName: metadata.deceasedGivenName || "",
				deceasedMiddleName: metadata.deceasedMiddleName || "",
				burialDate:
					metadata.burialDate ||
					(isBurial ? record.endorsementDate.toISOString() : ""),
				street:
					assistanceDetails[type].street ||
					metadata.street ||
					legacyStreet ||
					"",
				subdivisionVillage:
					assistanceDetails[type].subdivisionVillage ||
					metadata.subdivisionVillage ||
					"",
				scholarshipBarangay:
					assistanceDetails[type].scholarshipBarangay ||
					metadata.barangay ||
					legacyBarangay ||
					"",
				cityMunicipality:
					assistanceDetails[type].cityMunicipality ||
					metadata.cityMunicipality ||
					constituent.household.town ||
					"",
				province:
					assistanceDetails[type].province ||
					metadata.province ||
					legacyProvince ||
					"",
				zipCode:
					assistanceDetails[type].zipCode ||
					metadata.zipCode ||
					legacyZipCode ||
					"",
				contactNumber:
					assistanceDetails[type].contactNumber ||
					constituent.contactNumber ||
					"",
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
				street: legacyStreet,
				subdivisionVillage: "",
				scholarshipBarangay: legacyBarangay,
				cityMunicipality: constituent.household.town,
				province: latestScholarship.province,
				zipCode: latestScholarship.zipCode.toString(),
				fatherLastName: latestScholarship.fatherLastName,
				fatherGivenName: latestScholarship.fatherGivenName,
				fatherMiddleName: latestScholarship.fatherMiddleName,
				motherMaidenLastName: latestScholarship.motherLastName,
				motherGivenName: latestScholarship.motherGivenName,
				motherMaidenMiddleName: latestScholarship.motherMiddleName,
				guardianName: "",
				guardianContactNo: latestScholarship.guardianContactNumber,
				guardianEmailAddress: latestScholarship.guardianEmailAddress,
			};
		}

		const latestDate =
			constituent.assistanceRecord[0]?.createdAt ??
			constituent.household.lastAidDate;
		const defaultAssistanceType =
			constituent.assistanceRecord[0]?.type ??
			(latestScholarship ? "Scholarship Grant" : "Assistance Request");

		const assistanceVisits = constituent.assistanceRecord.map((record) => ({
			id: record.id,
			date: record.createdAt.toISOString(),
			title: "Beneficiary Record",
			assistanceType: record.type || "Assistance Request",
			notes: "",
			assistanceDetails:
				assistanceDetails[record.type || "Assistance Request"] ?? {},
		}));

		const scholarshipVisits = latestScholarship
			? [
					{
						id: `scholarship-${latestScholarship.id.toString()}`,
						date: constituent.household.lastAidDate.toISOString(),
						title: "Beneficiary Record",
						assistanceType: "Scholarship Grant",
						notes: "",
						assistanceDetails: assistanceDetails["Scholarship Grant"] ?? {},
					},
				]
			: [];

		const visits = [...assistanceVisits, ...scholarshipVisits].sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		);

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
