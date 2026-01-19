import type { Request } from "express";
import type { AuthenticatedUser } from "@/app/auth";

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
	user?: AuthenticatedUser;
}

/**
 * oRPC context type with authenticated request
 * This matches the context shape defined in ORPCModule.forRootAsync
 */
export interface ORPCContext {
	request: AuthenticatedRequest;
}
