export type MainFormState = {
	familyName: string;
	firstName: string;
	middleName: string;
	municipality: string;
	barangay: string;
	sex: string;
	civilStatus: string;
	age: string;
	phoneNumber: string;
	email: string;
	purpose: string;
	claimantLastName: string;
	claimantGivenName: string;
	claimantMiddleName: string;
	patientLastName: string;
	patientGivenName: string;
	patientMiddleName: string;
	deceasedLastName: string;
	deceasedGivenName: string;
	deceasedMiddleName: string;
	burialDate: Date | undefined;
	medicineName: string;
	hospitalName: string;
	relationToDeceased: string;
	laboratoryType: string;
	schoolName: string;
	courseProgram: string;
	seq: string;
	studentId: string;
	lastName: string;
	givenName: string;
	extName: string;
	scholarshipMiddleName: string;
	scholarshipSex: string;
	scholarshipBirthdate: Date | undefined;
	birthdate: string;
	assistanceDate: Date | undefined;
	completeProgramName: string;
	yearLevel: string;
	streetBarangay: string;
	townCityMunicipality: string;
	street: string;
	subdivisionVillage: string;
	scholarshipBarangay: string;
	cityMunicipality: string;
	province: string;
	zipCode: string;
	contactNumber: string;
	emailAddress: string;
	heiUii: string;
	heiName: string;
	fatherLastName: string;
	fatherGivenName: string;
	fatherMiddleName: string;
	motherMaidenLastName: string;
	motherGivenName: string;
	motherMaidenMiddleName: string;
	endorsementDate: Date | undefined;
	guardianName: string;
	guardianContactNo: string;
	guardianEmailAddress: string;
};

export const INITIAL_BENEFICIARY_FORM_STATE: MainFormState = {
	familyName: "",
	firstName: "",
	middleName: "",
	municipality: "",
	barangay: "",
	sex: "",
	civilStatus: "",
	age: "",
	phoneNumber: "",
	email: "",
	purpose: "",
	claimantLastName: "",
	claimantGivenName: "",
	claimantMiddleName: "",
	patientLastName: "",
	patientGivenName: "",
	patientMiddleName: "",
	deceasedLastName: "",
	deceasedGivenName: "",
	deceasedMiddleName: "",
	burialDate: undefined,
	medicineName: "",
	hospitalName: "",
	relationToDeceased: "",
	laboratoryType: "",
	schoolName: "",
	courseProgram: "",
	seq: "",
	studentId: "",
	lastName: "",
	givenName: "",
	extName: "",
	scholarshipMiddleName: "",
	scholarshipSex: "",
	scholarshipBirthdate: undefined,
	birthdate: "",
	assistanceDate: undefined,
	completeProgramName: "",
	yearLevel: "",
	streetBarangay: "",
	townCityMunicipality: "",
	street: "",
	subdivisionVillage: "",
	scholarshipBarangay: "",
	cityMunicipality: "",
	province: "",
	zipCode: "",
	contactNumber: "",
	emailAddress: "",
	heiUii: "",
	heiName: "",
	fatherLastName: "",
	fatherGivenName: "",
	fatherMiddleName: "",
	motherMaidenLastName: "",
	motherGivenName: "",
	motherMaidenMiddleName: "",
	endorsementDate: undefined,
	guardianName: "",
	guardianContactNo: "",
	guardianEmailAddress: "",
};

export const ILOILO_LOCALITIES = [
	"Ajuy",
	"Alimodian",
	"Anilao",
	"Badiangan",
	"Balasan",
	"Banate",
	"Barotac Nuevo",
	"Barotac Viejo",
	"Batad",
	"Bingawan",
	"Cabatuan",
	"Calinog",
	"Carles",
	"Concepcion",
	"Dingle",
	"Dueñas",
	"Dumangas",
	"Estancia",
	"Guimbal",
	"Igbaras",
	"Janiuay",
	"Lambunao",
	"Leganes",
	"Lemery",
	"Leon",
	"Maasin",
	"Miagao",
	"Mina",
	"New Lucena",
	"Oton",
	"Pavia",
	"Pototan",
	"San Dionisio",
	"San Enrique",
	"San Joaquin",
	"San Miguel",
	"San Rafael",
	"Santa Barbara",
	"Sara",
	"Tigbauan",
	"Tubungan",
	"Zarraga",
];

export const ASSISTANCE_TYPES = [
	"Medicine Assistance",
	"Burial Assistance",
	"Hospital Bill Assistance",
	"Laboratory Fees Assistance",
	"Scholarship Grant",
];

export const SCHOLARSHIP_REQUIRED_FIELDS: Array<keyof MainFormState> = [
	"seq",
	"studentId",
	"lastName",
	"givenName",
	"scholarshipMiddleName",
	"scholarshipSex",
	"scholarshipBirthdate",
	"contactNumber",
	"completeProgramName",
	"studentId",
	"yearLevel",
	"street",
	"subdivisionVillage",
	"scholarshipBarangay",
	"cityMunicipality",
	"province",
	"zipCode",
	"contactNumber",
	"heiUii",
	"heiName",
	"fatherLastName",
	"fatherGivenName",
	"fatherMiddleName",
	"motherMaidenLastName",
	"motherGivenName",
	"motherMaidenMiddleName",
	"guardianName",
	"guardianContactNo",
];
