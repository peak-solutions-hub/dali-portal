export const CallerSlipStatus = {
	PENDING: "pending",
	COMPLETED: "completed",
} as const;

export type CallerSlipStatus =
	(typeof CallerSlipStatus)[keyof typeof CallerSlipStatus];
export const CALLER_SLIP_STATUS_VALUES: CallerSlipStatus[] =
	Object.values(CallerSlipStatus);
