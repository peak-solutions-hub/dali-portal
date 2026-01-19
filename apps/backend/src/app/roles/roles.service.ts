import { Injectable } from "@nestjs/common";
import type { RoleListResponse } from "@repo/shared";
import { DbService } from "@/app/db/db.service";

@Injectable()
export class RolesService {
	constructor(private readonly db: DbService) {}

	async getRoles(): Promise<RoleListResponse> {
		const roles = await this.db.role.findMany({
			orderBy: {
				name: "asc",
			},
		});

		return {
			roles,
		};
	}
}
