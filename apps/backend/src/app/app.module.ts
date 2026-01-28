import { Module } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { ORPCError, ORPCModule, onError } from "@orpc/nest";
import { experimental_RethrowHandlerPlugin as RethrowHandlerPlugin } from "@orpc/server/plugins";
import { Request } from "express";
import { AppController } from "@/app/app.controller";
import { DbModule } from "@/app/db/db.module";
import { InquiryTicketModule } from "@/app/inquiry-ticket/inquiry-ticket.module";
import { LegislativeDocumentsModule } from "@/app/legislative-documents/legislative-documents.module";
import { RolesModule } from "@/app/roles/roles.module";
import { SessionModule } from "@/app/session/session.module";
import { UsersModule } from "@/app/users/users.module";
import { SupabaseModule } from "@/app/util/supabase/supabase.module";
import { LibModule } from "@/lib/lib.module";
import { AppService } from "./app.service";

// https://orpc.dev/docs/openapi/integrations/implement-contract-in-nest#configuration
declare module "@orpc/nest" {
	/**
	 * Extend oRPC global context to make it type-safe inside your handlers/middlewares
	 */
	interface ORPCGlobalContext {
		request: Request;
	}
}

@Module({
	imports: [
		LibModule,
		DbModule,
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
				plugins: [
					new RethrowHandlerPlugin({
						filter: (error) => {
							return !(error instanceof ORPCError);
						},
					}),
				],
			}),
		}),
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
