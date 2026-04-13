import { Injectable } from "@nestjs/common";
import { ALL_ROLES, type RoleListResponse, RoleSchema } from "@repo/shared";
import { DbService } from "@/app/db/db.service";

@Injectable()
export class RolesService {
	constructor(private readonly db: DbService) {}

	async getRoles(): Promise<RoleListResponse> {
		const roles = await this.db.role.findMany({
			where: {
				name: {
					in: ALL_ROLES,
				},
			},
		});

		const validRoles = roles
			.filter((role) => RoleSchema.safeParse(role).success)
			.sort((a, b) => a.name.localeCompare(b.name));

		return {
			roles: validRoles,
		};
	}
}
