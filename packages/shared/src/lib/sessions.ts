import type { SupabaseClient } from "@supabase/supabase-js";
import {
	DEFAULT_SIGNED_URL_EXPIRY,
	SESSION_AGENDA_BUCKET,
	SESSION_AGENDA_ITEM_ATTACHMENTS_BUCKET,
	SESSION_JOURNAL_BUCKET,
	SESSION_MINUTES_BUCKET,
} from "../constants/session-rules";
import type { SessionWithAgenda } from "../schemas/session.schema";

/**
 * Get a signed URL for a file in Supabase Storage
 * @param supabase - Supabase client instance
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or undefined if error
 */
export async function getSignedUrl(
	supabase: SupabaseClient,
	bucket: string,
	path: string,
	expiresIn = DEFAULT_SIGNED_URL_EXPIRY,
): Promise<string | undefined> {
	const { data, error } = await supabase.storage
		.from(bucket)
		.createSignedUrl(path, expiresIn);

	if (error) {
		return undefined;
	}

	return data.signedUrl;
}

/**
 * Get a signed URL for a session's agenda file
 * @param supabase - Supabase client instance
 * @param session - Session with file path information
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or undefined if session has no agenda file
 */
export async function getSessionAgendaUrl(
	supabase: SupabaseClient,
	session: SessionWithAgenda,
	expiresIn = DEFAULT_SIGNED_URL_EXPIRY,
): Promise<string | undefined> {
	if (!session.agendaFilePath) {
		return undefined;
	}

	return await getSignedUrl(
		supabase,
		SESSION_AGENDA_BUCKET,
		session.agendaFilePath,
		expiresIn,
	);
}

/**
 * Get a signed URL for a session's minutes file
 * @param supabase - Supabase client instance
 * @param session - Session with file path information
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or undefined if session has no minutes file
 */
export async function getSessionMinutesUrl(
	supabase: SupabaseClient,
	session: SessionWithAgenda,
	expiresIn = DEFAULT_SIGNED_URL_EXPIRY,
): Promise<string | undefined> {
	if (!session.minutesFilePath) {
		return undefined;
	}

	return await getSignedUrl(
		supabase,
		SESSION_MINUTES_BUCKET,
		session.minutesFilePath,
		expiresIn,
	);
}

/**
 * Get a signed URL for a session's journal file
 * @param supabase - Supabase client instance
 * @param session - Session with file path information
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or undefined if session has no journal file
 */
export async function getSessionJournalUrl(
	supabase: SupabaseClient,
	session: SessionWithAgenda,
	expiresIn = DEFAULT_SIGNED_URL_EXPIRY,
): Promise<string | undefined> {
	if (!session.journalFilePath) {
		return undefined;
	}

	return await getSignedUrl(
		supabase,
		SESSION_JOURNAL_BUCKET,
		session.journalFilePath,
		expiresIn,
	);
}

/**
 * Get a signed URL for a session agenda item's attachment file
 * @param supabase - Supabase client instance
 * @param attachmentPath - File path within the attachments bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or undefined if no attachment path provided
 */
export async function getSessionAgendaItemAttachmentUrl(
	supabase: SupabaseClient,
	attachmentPath: string | null,
	expiresIn = DEFAULT_SIGNED_URL_EXPIRY,
): Promise<string | undefined> {
	if (!attachmentPath) {
		return undefined;
	}

	return await getSignedUrl(
		supabase,
		SESSION_AGENDA_ITEM_ATTACHMENTS_BUCKET,
		attachmentPath,
		expiresIn,
	);
}
