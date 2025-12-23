/**
 * @fileoverview Document Workflow Rules
 *
 * This file defines the core business logic for document processing:
 * 1. Which PurposeTypes are valid for each DocumentType
 * 2. Which StatusTypes can transition to which other statuses (per PurposeType)
 *
 * These rules are used by:
 * - Frontend: To filter dropdown options dynamically
 * - Backend: To validate transitions in NestJS guards/validators
 * - Shared: To ensure UI and API agree on allowed actions
 */

import { DocumentType, PurposeType, StatusType } from "../enums";

// =============================================================================
// DOCUMENT TYPE → PURPOSE TYPE MAPPING
// =============================================================================

/**
 * Defines which purposes are allowed for each document type.
 *
 * Business Logic:
 * - Legislative docs (Ordinances, Resolutions, Committee Reports) → FOR_AGENDA or FOR_FILING
 * - Administrative docs (Payroll, Contracts, Leave) → FOR_ACTION or FOR_FILING
 * - Flexible docs (Letters, Memos, Endorsements) → Any purpose
 * - Invitations → FOR_CALLER_SLIP or FOR_FILING
 */
export const DOCUMENT_PURPOSE_MAP: Record<
	DocumentType,
	readonly PurposeType[]
> = {
	// Legislative Documents: Usually go to session, but sometimes just filed
	[DocumentType.PROPOSED_ORDINANCE]: [
		PurposeType.FOR_AGENDA,
		PurposeType.FOR_FILING,
	],
	[DocumentType.PROPOSED_RESOLUTION]: [
		PurposeType.FOR_AGENDA,
		PurposeType.FOR_FILING,
	],
	[DocumentType.COMMITTEE_REPORT]: [
		PurposeType.FOR_AGENDA,
		PurposeType.FOR_FILING,
	],

	// Administrative Documents: Require action/signature, never go to session
	[DocumentType.PAYROLL]: [PurposeType.FOR_ACTION, PurposeType.FOR_FILING],
	[DocumentType.CONTRACT_OF_SERVICE]: [
		PurposeType.FOR_ACTION,
		PurposeType.FOR_FILING,
	],
	[DocumentType.LEAVE_APPLICATION]: [
		PurposeType.FOR_ACTION,
		PurposeType.FOR_FILING,
	],

	// Flexible Documents: Can be used for any purpose depending on content
	[DocumentType.LETTER]: [
		PurposeType.FOR_AGENDA,
		PurposeType.FOR_ACTION,
		PurposeType.FOR_FILING,
	],
	[DocumentType.MEMO]: [
		PurposeType.FOR_AGENDA,
		PurposeType.FOR_ACTION,
		PurposeType.FOR_FILING,
	],
	[DocumentType.ENDORSEMENT]: [
		PurposeType.FOR_AGENDA,
		PurposeType.FOR_ACTION,
		PurposeType.FOR_FILING,
	],

	// Invitations: Go through caller slip
	[DocumentType.INVITATION]: [PurposeType.FOR_CALLER_SLIP],
} as const;

/**
 * Get allowed purposes for a document type.
 * Falls back to all purposes if the type is unknown.
 */
export function getAllowedPurposes(type: DocumentType): readonly PurposeType[] {
	return DOCUMENT_PURPOSE_MAP[type] ?? Object.values(PurposeType);
}

/**
 * Check if a purpose is valid for a document type.
 */
export function isPurposeAllowed(
	type: DocumentType,
	purpose: PurposeType,
): boolean {
	const allowed = getAllowedPurposes(type);
	return allowed.includes(purpose);
}

// =============================================================================
// PURPOSE TYPE → STATUS FLOW MAPPING
// =============================================================================

/**
 * Status transitions that are common across flows.
 */
const COMMON_REJECTIONS: readonly StatusType[] = [StatusType.RETURNED] as const;

/**
 * Defines the valid next statuses for each (purpose, currentStatus) pair.
 *
 * Workflow Summary:
 *
 * FOR_AGENDA (Legislative Flow):
 *   RECEIVED → FOR_INITIAL → FOR_SIGNATURE → APPROVED → CALENDARED → PUBLISHED
 *                    ↓              ↓
 *                RETURNED ←────────┘
 *
 * FOR_ACTION (Administrative Flow):
 *   RECEIVED → FOR_INITIAL → FOR_SIGNATURE → APPROVED → RELEASED
 *                    ↓              ↓
 *                RETURNED ←────────┘
 *
 * FOR_FILING (Archive Flow):
 *   RECEIVED → RELEASED (immediate filing)
 *
 * FOR_CALLER_SLIP (Invitation Flow):
 *   RECEIVED → FOR_INITIAL → FOR_SIGNATURE → RELEASED
 */
export const STATUS_FLOW_MAP: Record<
	PurposeType,
	Partial<Record<StatusType, readonly StatusType[]>>
> = {
	// =========================================================================
	// LEGISLATIVE FLOW (Ordinances, Resolutions)
	// Goal: Get it Approved, Calendar it, then Publish it.
	// =========================================================================
	[PurposeType.FOR_AGENDA]: {
		[StatusType.RECEIVED]: [StatusType.FOR_INITIAL],
		[StatusType.FOR_INITIAL]: [StatusType.FOR_SIGNATURE, ...COMMON_REJECTIONS],
		[StatusType.FOR_SIGNATURE]: [StatusType.APPROVED, ...COMMON_REJECTIONS],
		[StatusType.APPROVED]: [StatusType.CALENDARED],
		[StatusType.CALENDARED]: [StatusType.PUBLISHED],
		[StatusType.RETURNED]: [StatusType.RECEIVED],
	},

	// =========================================================================
	// ADMINISTRATIVE FLOW (Payroll, Contracts, Leave)
	// Goal: Get it Signed, then release the physical copy.
	// =========================================================================
	[PurposeType.FOR_ACTION]: {
		[StatusType.RECEIVED]: [StatusType.FOR_INITIAL],
		[StatusType.FOR_INITIAL]: [StatusType.FOR_SIGNATURE, ...COMMON_REJECTIONS],
		[StatusType.FOR_SIGNATURE]: [StatusType.APPROVED, ...COMMON_REJECTIONS],
		[StatusType.APPROVED]: [StatusType.RELEASED],
		[StatusType.RETURNED]: [StatusType.RECEIVED],
	},

	// =========================================================================
	// ARCHIVE FLOW (FYI Documents)
	// Goal: Acknowledge receipt and file away immediately.
	// =========================================================================
	[PurposeType.FOR_FILING]: {
		[StatusType.RECEIVED]: [StatusType.RELEASED],
	},

	// =========================================================================
	// INVITATION FLOW (Caller's Slips)
	// Goal: Batch invitations, get VM decision, then release instructions.
	// =========================================================================
	[PurposeType.FOR_CALLER_SLIP]: {
		[StatusType.RECEIVED]: [StatusType.FOR_INITIAL], // Added to draft batch
		[StatusType.FOR_INITIAL]: [StatusType.FOR_SIGNATURE], // Batch finalized, sent to VM
		[StatusType.FOR_SIGNATURE]: [StatusType.RELEASED], // VM decided (attend/decline)
	},
} as const;

/**
 * Get the valid next statuses for a document given its purpose and current status.
 * Returns an empty array if no transitions are valid (terminal state).
 */
export function getNextStatuses(
	purpose: PurposeType,
	currentStatus: StatusType,
): readonly StatusType[] {
	const flowMap = STATUS_FLOW_MAP[purpose];
	if (!flowMap) return [];

	return flowMap[currentStatus] ?? [];
}

/**
 * Check if a status transition is valid.
 */
export function isTransitionAllowed(
	purpose: PurposeType,
	currentStatus: StatusType,
	nextStatus: StatusType,
): boolean {
	const allowed = getNextStatuses(purpose, currentStatus);
	return allowed.includes(nextStatus);
}

/**
 * Get the initial status for a new document (always RECEIVED).
 */
export function getInitialStatus(): StatusType {
	return StatusType.RECEIVED;
}

/**
 * Check if a status is a terminal (final) state for a given purpose.
 */
export function isTerminalStatus(
	purpose: PurposeType,
	status: StatusType,
): boolean {
	const nextStatuses = getNextStatuses(purpose, status);
	return nextStatuses.length === 0;
}
