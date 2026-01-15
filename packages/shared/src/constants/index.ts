export * from "./document-rules";

export const TEXT_LIMITS = {
	XS: 50, // names, etc
	SM: 280, // titles, subjects
	MD: 500, // Short descriptions, remarks
	LG: 1000,
} as const;

export const FILE_SIZE_LIMITS = {
	XS: 5 * 1024 * 1024, //5mb
	SM: 10 * 1024 * 1024, //10mb
	MD: 25 * 1024 * 1024, //25mb
	LG: 50 * 1024 * 1024, //50mb
} as const;

export const FILE_COUNT_LIMITS = {
	XS: 1, // 1 file
	SM: 3, // 3 files
	MD: 5, // 5 files
	LG: 8,
};
