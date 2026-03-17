/**
 * @fileoverview Legislative Document Configuration Constants
 *
 * Single source of truth for all legislative document limits,
 * thresholds, and configuration values.
 *
 * Used by:
 * - Schemas: Zod validation min/max/default values
 * - Helpers: Pagination defaults, search param validation
 * - Frontend: Year filter generation, pagination config
 */

// =============================================================================
// YEAR RANGE
// =============================================================================

/** Earliest year for legislative document series/filters */
export const LEGISLATIVE_YEAR_MIN = 1950;

/** Latest allowed year for schema validation */
export const LEGISLATIVE_YEAR_MAX = 2100;

// =============================================================================
// PAGINATION
// =============================================================================

/** Default number of documents per page */
export const LEGISLATIVE_ITEMS_PER_PAGE = 10;

/** Maximum documents allowed per query */
export const LEGISLATIVE_MAX_ITEMS_PER_PAGE = 100;

/** Default number of latest documents for the home page widget */
export const LEGISLATIVE_FEATURED_LIMIT = 5;

// =============================================================================
// STORAGE / URL
// =============================================================================

/** Signed URL expiration time in seconds (1 hour) */
export const SIGNED_URL_EXPIRY_SECONDS = 3600;
