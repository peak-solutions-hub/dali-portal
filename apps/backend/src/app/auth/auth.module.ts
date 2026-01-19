import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { DbModule } from "@/app/db/db.module";
import { SupabaseJwtStrategy } from "./strategies/supabase-jwt.strategy";

@Module({
	imports: [
		PassportModule.register({ defaultStrategy: "supabase-jwt" }),
		DbModule,
	],
	providers: [SupabaseJwtStrategy],
	exports: [PassportModule],
})
export class AuthModule {}
