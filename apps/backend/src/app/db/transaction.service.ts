import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { Prisma } from "@/generated/prisma/client";
import { DbService } from "./db.service";

export const INJECTED_TRANSACTION_CLIENT = Symbol(
	"INJECTED_TRANSACTION_CLIENT",
);

interface RunTransactionOptions {
	maxWait?: number;
	timeout?: number;
	isolationLevel?: Prisma.TransactionIsolationLevel;
	retries?: number;
	retryDelayMs?: number;
	retryJitterMs?: number;
}

const RETRY_DEFAULTS = {
	retries: 0,
	retryDelayMs: 50,
	retryJitterMs: 50,
} as const;

@Injectable()
export class TransactionService {
	private readonly logger = new Logger(TransactionService.name);

	constructor(
		private readonly db: DbService,
		@Optional()
		@Inject(INJECTED_TRANSACTION_CLIENT)
		private readonly injectedTransactionClient: Prisma.TransactionClient | null,
	) {}

	async run<T>(
		operation: string,
		handler: (tx: Prisma.TransactionClient) => Promise<T>,
		options: RunTransactionOptions = {},
	): Promise<T> {
		if (this.injectedTransactionClient) {
			this.logger.debug(
				`[${operation}] using injected transaction client (test override)`,
			);
			return handler(this.injectedTransactionClient);
		}

		const maxRetries = options.retries ?? RETRY_DEFAULTS.retries;
		const retryDelayMs = options.retryDelayMs ?? RETRY_DEFAULTS.retryDelayMs;
		const retryJitterMs = options.retryJitterMs ?? RETRY_DEFAULTS.retryJitterMs;

		let attempt = 0;

		while (true) {
			const start = Date.now();

			try {
				const result = await this.db.$transaction((tx) => handler(tx), {
					maxWait: options.maxWait,
					timeout: options.timeout,
					isolationLevel: options.isolationLevel,
				});

				const durationMs = Date.now() - start;
				this.logger.debug(
					`[${operation}] transaction success (attempt=${attempt + 1}, durationMs=${durationMs})`,
				);

				return result;
			} catch (error) {
				const durationMs = Date.now() - start;

				if (this.isRetryableConflict(error) && attempt < maxRetries) {
					const delayMs = this.computeRetryDelay(
						attempt,
						retryDelayMs,
						retryJitterMs,
					);

					this.logger.warn(
						`[${operation}] transaction conflict (attempt=${attempt + 1}, durationMs=${durationMs}, retryInMs=${delayMs})`,
					);

					await this.sleep(delayMs);
					attempt += 1;
					continue;
				}

				const code =
					error instanceof Prisma.PrismaClientKnownRequestError
						? error.code
						: "UNKNOWN";

				this.logger.warn(
					`[${operation}] transaction failed (attempt=${attempt + 1}, durationMs=${durationMs}, code=${code})`,
				);

				throw error;
			}
		}
	}

	private isRetryableConflict(
		error: unknown,
	): error is Prisma.PrismaClientKnownRequestError {
		return (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2034"
		);
	}

	private computeRetryDelay(
		attempt: number,
		baseDelayMs: number,
		jitterMs: number,
	): number {
		const exponential = baseDelayMs * 2 ** attempt;
		const jitter = Math.floor(Math.random() * (jitterMs + 1));
		return exponential + jitter;
	}

	private async sleep(ms: number): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, ms));
	}
}
