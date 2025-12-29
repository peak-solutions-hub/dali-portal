export const SexType = {
	MALE: "male",
	FEMALE: "female",
} as const;

export type SexType = (typeof SexType)[keyof typeof SexType];
export const SEX_TYPE_VALUES: SexType[] = Object.values(SexType);
