export type SessionType = "regular" | "special";
export type SessionStatus = "scheduled" | "completed";

export interface Session {
	id: string;
	sessionNumber: string;
	type: SessionType;
	date: string; // ISO date string
	time: string;
	status: SessionStatus;
}
