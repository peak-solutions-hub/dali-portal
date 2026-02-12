import { oc } from "@orpc/contract";
import { ERRORS } from "../constants";
import { RoleListResponseSchema } from "../schemas/role.schema";

export const getRolesListContract = oc
	.route({
		method: "GET",
		path: "/roles",
		summary: "List all roles",
		description: "Retrieve a list of all available user roles in the system",
		tags: ["Roles", "Admin"],
	})
	.output(RoleListResponseSchema)
	.errors({
		UNAUTHORIZED: ERRORS.AUTH.AUTHENTICATION_REQUIRED,
		INSUFFICIENT_PERMISSIONS: ERRORS.AUTH.INSUFFICIENT_PERMISSIONS,
	});

export const roleContract = {
	list: getRolesListContract,
};
