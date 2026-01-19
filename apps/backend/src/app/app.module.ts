import { Module } from "@nestjs/common";
import { APP_GUARD, REQUEST } from "@nestjs/core";
import { ORPCModule, onError } from "@orpc/nest";
import type { Request } from "express";
import { AppController } from "@/app/app.controller";
import { AuthModule, JwtAuthGuard, RolesGuard } from "@/app/auth";
import { DbModule } from "@/app/db/db.module";
import { InquiryTicketModule } from "@/app/inquiry-ticket/inquiry-ticket.module";
import { LegislativeDocumentsModule } from "@/app/legislative-documents/legislative-documents.module";
import { RolesModule } from "@/app/roles/roles.module";
import { SessionModule } from "@/app/session/session.module";
import { UsersModule } from "@/app/users/users.module";
import { SupabaseModule } from "@/app/util/supabase/supabase.module";
import { LibModule } from "@/lib/lib.module";
import { AppService } from "./app.service";

@Module({
	imports: [
		LibModule,
		DbModule,
		AuthModule,
		SupabaseModule,
		InquiryTicketModule,
		LegislativeDocumentsModule,
		RolesModule,
		UsersModule,
		SessionModule,
		// orpc
		ORPCModule.forRootAsync({
			inject: [REQUEST],
			useFactory: (request: Request) => ({
				context: { request }, // oRPC context, accessible from middlewares, etc.
				interceptors: [
					onError((error) => {
						console.error(error);
					}),
				],
				customJsonSerializers: [],
				// commented for now
				// plugins: [
				// 	new RethrowHandlerPlugin({
				// 		filter: (error) => {
				// 			// Rethrow all non-ORPCError errors
				// 			// This allows unhandled exceptions to bubble up to NestJS global exception filters
				// 			return !(error instanceof ORPCError);
				// 		},
				// 	}),
				// ],
			}),
		}),
	],
	controllers: [AppController],
	providers: [
		AppService,
		// Global guards - applied to all routes
		// JwtAuthGuard runs first, then RolesGuard
		// Use @Public() decorator to skip authentication for specific routes
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard,
		},
		{
			provide: APP_GUARD,
			useClass: RolesGuard,
		},
	],
})
export class AppModule {}
