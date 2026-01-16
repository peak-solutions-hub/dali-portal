import { Injectable } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { ConfigService } from "@/lib/config.service";

@Injectable()
export class SupabaseAdminService {
	private client: SupabaseClient;

	constructor(private readonly configService: ConfigService) {
		const supabaseUrl = this.configService.getOrThrow("supabase.url") as string;
		const supabaseServiceRoleKey = this.configService.getOrThrow(
			"supabase.serviceRoleKey",
		) as string;

		this.client = createClient(supabaseUrl, supabaseServiceRoleKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		});
	}

	getClient(): SupabaseClient {
		return this.client;
	}
}
