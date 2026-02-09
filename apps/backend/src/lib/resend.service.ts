import { Injectable } from "@nestjs/common";
import { CreateEmailOptions, CreateEmailRequestOptions, Resend } from "resend";
import { ConfigService } from "./config.service";

@Injectable()
export class ResendService extends Resend {
	constructor(configService: ConfigService) {
		super(configService.getOrThrow("resend.apiKey"));
	}

	async send(payload: CreateEmailOptions, options?: CreateEmailRequestOptions) {
		return await this.emails.send(payload, options);
	}
}
