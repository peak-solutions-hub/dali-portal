export const DecisionType = {
	ATTEND: "attend",
	DECLINE: "decline",
	ASSIGN_REPRESENTATIVE: "assign_representative",
} as const;

export type DecisionType = (typeof DecisionType)[keyof typeof DecisionType];
export const DECISION_TYPE_VALUES: DecisionType[] = Object.values(DecisionType);
