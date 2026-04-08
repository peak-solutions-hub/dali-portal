jest.mock("@/generated/prisma/client", () => {
	class PrismaClientKnownRequestError extends Error {
		code: string;

		constructor(message: string, options: { code: string }) {
			super(message);
			this.name = "PrismaClientKnownRequestError";
			this.code = options.code;
		}
	}

	return {
		PrismaClient: class PrismaClient {
			$transaction = jest.fn();
		},
		Prisma: {
			PrismaClientKnownRequestError,
			TransactionIsolationLevel: {
				Serializable: "Serializable",
				ReadCommitted: "ReadCommitted",
			},
		},
	};
});

import { Prisma } from "@/generated/prisma/client";
import { TransactionService } from "./transaction.service";

function createKnownRequestError(code: string) {
	const error = new Error(`Prisma error ${code}`) as Error & { code: string };
	error.name = "PrismaClientKnownRequestError";
	error.code = code;
	Object.setPrototypeOf(error, Prisma.PrismaClientKnownRequestError.prototype);
	return error;
}

describe("TransactionService", () => {
	it("retries on P2034 conflict and eventually succeeds", async () => {
		const db = {
			$transaction: jest.fn(),
		};
		const service = new TransactionService(db as never, null);

		const retryableConflict = createKnownRequestError("P2034");
		const options = {
			retries: 2,
			retryDelayMs: 0,
			retryJitterMs: 0,
			maxWait: 500,
			timeout: 1_000,
			isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
		} as const;

		let attempts = 0;
		db.$transaction.mockImplementation(
			(callback: (tx: unknown) => Promise<string>) => {
				attempts += 1;
				if (attempts === 1) {
					throw retryableConflict;
				}

				return callback({});
			},
		);

		const handler = jest.fn(async () => "ok");

		const result = await service.run("tx.retry.success", handler, options);

		expect(result).toBe("ok");
		expect(db.$transaction).toHaveBeenCalledTimes(2);
		expect(handler).toHaveBeenCalledTimes(1);
		expect(db.$transaction).toHaveBeenNthCalledWith(1, expect.any(Function), {
			maxWait: options.maxWait,
			timeout: options.timeout,
			isolationLevel: options.isolationLevel,
		});
	});

	it("stops retrying after max retries for P2034", async () => {
		const db = {
			$transaction: jest.fn(),
		};
		const service = new TransactionService(db as never, null);

		const retryableConflict = createKnownRequestError("P2034");
		db.$transaction.mockRejectedValue(retryableConflict);

		await expect(
			service.run("tx.retry.exhausted", async () => "never", {
				retries: 1,
				retryDelayMs: 0,
				retryJitterMs: 0,
			}),
		).rejects.toBe(retryableConflict);

		expect(db.$transaction).toHaveBeenCalledTimes(2);
	});

	it("does not retry non-retryable Prisma errors", async () => {
		const db = {
			$transaction: jest.fn(),
		};
		const service = new TransactionService(db as never, null);

		const uniqueViolation = createKnownRequestError("P2002");
		db.$transaction.mockRejectedValue(uniqueViolation);

		await expect(
			service.run("tx.no.retry", async () => "never", {
				retries: 5,
				retryDelayMs: 0,
				retryJitterMs: 0,
			}),
		).rejects.toBe(uniqueViolation);

		expect(db.$transaction).toHaveBeenCalledTimes(1);
	});

	it("uses injected transaction client without opening a new transaction", async () => {
		const db = {
			$transaction: jest.fn(),
		};
		const injectedTxClient = { invitation: { updateMany: jest.fn() } };
		const service = new TransactionService(
			db as never,
			injectedTxClient as never,
		);

		const handler = jest.fn(async () => "ok-with-injected-client");

		const result = await service.run("tx.injected.client", handler);

		expect(result).toBe("ok-with-injected-client");
		expect(handler).toHaveBeenCalledTimes(1);
		expect(handler).toHaveBeenCalledWith(injectedTxClient);
		expect(db.$transaction).not.toHaveBeenCalled();
	});
});
