export type SessionType = "regular" | "special";

export interface Session {
	id: string;
	sessionNumber: string;
	type: SessionType;
	date: string; // ISO date string
	time: string;
}
