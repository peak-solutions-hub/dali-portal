import { Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";
import { Get, Paths } from "type-fest";
import config from "@/config";

export type ConfigType = ReturnType<typeof config>;

@Injectable()
export class ConfigService {
	constructor(private nestConfigService: NestConfigService<ConfigType, true>) {}

	get<K extends Paths<ConfigType>, T = Get<ConfigType, K>>(key: K): T {
		return this.nestConfigService.get(key, { infer: true });
	}

	getOrThrow<K extends Paths<ConfigType>, T = Get<ConfigType, K>>(key: K): T {
		return this.nestConfigService.getOrThrow(key, { infer: true });
	}
}
