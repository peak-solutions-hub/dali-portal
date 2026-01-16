import { oc } from "@orpc/contract";
import { RoleListResponseSchema } from "../schemas/role.schema";

// Get roles list
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
		UNAUTHORIZED: {
			message: "User not authorized to access roles",
		},
	});

// Export role contract
export const roleContract = {
	list: getRolesListContract,
};
