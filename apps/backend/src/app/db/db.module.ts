import { Global, Module } from "@nestjs/common";
import { DbService } from "@/app/db/db.service";
import {
	INJECTED_TRANSACTION_CLIENT,
	TransactionService,
} from "@/app/db/transaction.service";

@Global()
@Module({
	imports: [],
	providers: [
		DbService,
		TransactionService,
		{
			provide: INJECTED_TRANSACTION_CLIENT,
			useValue: null,
		},
	],
	exports: [DbService, TransactionService, INJECTED_TRANSACTION_CLIENT],
})
export class DbModule {}
