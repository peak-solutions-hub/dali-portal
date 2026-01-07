import {
	type ArgumentMetadata,
	BadRequestException,
	Injectable,
	type PipeTransform,
} from "@nestjs/common";

@Injectable()
export class ParseLegislativeDocumentIdPipe implements PipeTransform<string> {
	transform(value: string, metadata: ArgumentMetadata): bigint {
		const numericId = Number.parseInt(value, 10);

		if (!Number.isFinite(numericId) || numericId <= 0) {
			throw new BadRequestException(
				`Invalid ${metadata.data || "id"}: must be a positive integer`,
			);
		}

		return BigInt(numericId);
	}
}

@Injectable()
export class ParseYearPipe
	implements PipeTransform<string, number | undefined>
{
	transform(value: string): number | undefined {
		if (!value || value === "all") {
			return undefined;
		}

		const year = Number.parseInt(value, 10);
		const currentYear = new Date().getFullYear();

		if (!Number.isFinite(year) || year < 1950 || year > currentYear + 1) {
			throw new BadRequestException(
				`Invalid year: must be between 1950 and ${currentYear + 1}`,
			);
		}

		return year;
	}
}

@Injectable()
export class ParsePagePipe implements PipeTransform<string, number> {
	transform(value: string): number {
		const page = Number.parseInt(value, 10);

		if (!Number.isFinite(page) || page < 1) {
			return 1; // Default to first page
		}

		return page;
	}
}

@Injectable()
export class ParseLimitPipe implements PipeTransform<string, number> {
	private readonly defaultLimit: number;
	private readonly maxLimit: number;

	constructor(defaultLimit = 10, maxLimit = 100) {
		this.defaultLimit = defaultLimit;
		this.maxLimit = maxLimit;
	}

	transform(value: string): number {
		if (!value) {
			return this.defaultLimit;
		}

		const limit = Number.parseInt(value, 10);

		if (!Number.isFinite(limit) || limit < 1) {
			return this.defaultLimit;
		}

		return Math.min(limit, this.maxLimit);
	}
}
