import type { Request } from "express";
import type { EnrichedUser } from "@/app/auth/guards/roles.guard";

/**
 * Extended Express Request with authenticated user
 * The user object is enriched with DB fields after RolesGuard runs
 */
export interface AuthenticatedRequest extends Request {
	user?: EnrichedUser;
}

/**
 * oRPC context type with authenticated request
 * This matches the context shape defined in ORPCModule.forRootAsync
 */
export interface ORPCContext {
	request: AuthenticatedRequest;
}
