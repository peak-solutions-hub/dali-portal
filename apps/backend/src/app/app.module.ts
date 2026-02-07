import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, REQUEST } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ORPCError, ORPCModule, onError } from "@orpc/nest";
import { experimental_RethrowHandlerPlugin as RethrowHandlerPlugin } from "@orpc/server/plugins";
import { Request } from "express";
import { AppController } from "@/app/app.controller";
import { DbModule } from "@/app/db/db.module";
import {
	PrismaClientExceptionFilter,
	PrismaInitializationExceptionFilter,
	PrismaRustPanicExceptionFilter,
	PrismaUnknownExceptionFilter,
	PrismaValidationExceptionFilter,
	ThrottlerExceptionFilter,
} from "@/app/exceptions";
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
		// global rate limit
		ThrottlerModule.forRoot([
			{
				// for bots: 3 reqs per sec
				name: "short",
				ttl: 1000,
				limit: 3,
			},
			// for users: 60 reqs per 1 min
			// override in controllers as needed
			{
				name: "default",
				ttl: 60000,
				limit: 60,
			},
		]),
	],
	controllers: [AppController],
	providers: [
		AppService,
		// Global rate limiting guard
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
		// Exception filters (order matters - more specific filters first)
		// Rate limiting
		{
			provide: APP_FILTER,
			useClass: ThrottlerExceptionFilter,
		},
		// Prisma error handling (from most specific to most general)
		{
			provide: APP_FILTER,
			useClass: PrismaClientExceptionFilter,
		},
		{
			provide: APP_FILTER,
			useClass: PrismaValidationExceptionFilter,
		},
		{
			provide: APP_FILTER,
			useClass: PrismaInitializationExceptionFilter,
		},
		{
			provide: APP_FILTER,
			useClass: PrismaUnknownExceptionFilter,
		},
		{
			provide: APP_FILTER,
			useClass: PrismaRustPanicExceptionFilter,
		},
	],
})
export class AppModule {}
