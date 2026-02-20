/**
 * @fileoverview User Management Pagination Constants
 *
 * Centralized pagination constants for user management to avoid magic numbers
 * in the admin UI and to keep behavior consistent across apps.
 */

/** Default number of users to display per page in the admin user management list */
export const USERS_ITEMS_PER_PAGE = 10;

/** Maximum allowed items per page for users (for future validation) */
export const USERS_MAX_ITEMS_PER_PAGE = 100;

/** Minimum allowed items per page for users */
export const USERS_MIN_ITEMS_PER_PAGE = 1;
