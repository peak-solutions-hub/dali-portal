import { Module } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { ORPCModule, onError } from "@orpc/nest";
import type { Request } from "express";
import { AppController } from "@/app/app.controller";
import { DbModule } from "@/app/db/db.module";
import { InquiryTicketModule } from "@/app/inquiry-ticket/inquiry-ticket.module";
import { LibModule } from "@/lib/lib.module";
import { AppService } from "./app.service";

@Module({
	imports: [
		LibModule,
		DbModule,
		InquiryTicketModule,
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
	providers: [AppService],
})
export class AppModule {}
