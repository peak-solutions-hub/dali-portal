// DEPRECATED: Re-export centralized session management types from @repo/shared.
// Keep this file for backward compatibility while migrating imports.
// Use: import type { SessionManagementSession, SessionManagementAgendaItem } from '@repo/shared'

export type AgendaItem = import("@repo/shared").SessionManagementAgendaItem;
export type Document = import("@repo/shared").SessionManagementDocument;
export type Session = import("@repo/shared").SessionManagementSession;
export type AgendaPanelProps =
	import("@repo/shared").SessionManagementAgendaPanelProps;
export type DocumentsPanelProps =
	import("@repo/shared").SessionManagementDocumentsPanelProps;
