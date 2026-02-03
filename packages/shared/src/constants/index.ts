export * from "./auth.constants";
export * from "./document-rules";
export * from "./role-permissions";
export * from "./session-rules";

export const TEXT_LIMITS = {
	XS: 50, // names, etc
	SM: 280, // titles, subjects
	MD: 500, // Short descriptions, remarks
	LG: 1000,
} as const;
