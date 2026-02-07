import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@repo/shared";
import { Public } from "@/app/auth";
import { SessionService } from "./session.service";

@Controller()
export class SessionController {
	constructor(private readonly sessionService: SessionService) {}

	@Public()
	@Implement(contract.sessions.list)
	list() {
		return implement(contract.sessions.list).handler(
			async ({ input, context }) => {
				return await this.sessionService.findAll(input);
			},
		);
	}

	@Public()
	@Implement(contract.sessions.getById)
	getById() {
		return implement(contract.sessions.getById).handler(
			async ({ input, context }) => {
				return await this.sessionService.findOne(input);
			},
		);
	}
}
