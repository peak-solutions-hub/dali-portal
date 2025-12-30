import { Injectable } from "@nestjs/common";
import { ConfigService } from "@/lib/config.service";

interface SignedUrlResponse {
	path: string;
	signedURL: string;
	error?: string;
}

@Injectable()
export class StorageService {
	constructor(private readonly configService: ConfigService) {}

	async getSignedUrl(
		bucketName: string,
		filePath: string,
		expiresIn = 3600,
	): Promise<string> {
		const supabaseUrl = this.configService.getOrThrow("supabase.url");
		const serviceRoleKey = this.configService.getOrThrow(
			"supabase.serviceRoleKey",
		);

		const apiUrl = `${supabaseUrl}/storage/v1/object/sign/${bucketName}`;

		try {
			const response = await fetch(apiUrl, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${serviceRoleKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					expiresIn,
					paths: [filePath],
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`Failed to generate signed URL: ${response.statusText} - ${errorText}`,
				);
			}

			const data: SignedUrlResponse[] = await response.json();

			if (!data || data.length === 0) {
				throw new Error("No signed URL returned from storage");
			}

			const result = data[0];

			if (result.error) {
				throw new Error(`Storage error: ${result.error}`);
			}
			return `${supabaseUrl}/storage/v1${result.signedURL}`;
		} catch (error) {
			console.error("Error generating signed URL:", error);
			throw error;
		}
	}

	async getSignedUrls(
		bucketName: string,
		filePaths: string[],
		expiresIn = 3600,
	): Promise<{ path: string; signedUrl: string }[]> {
		const supabaseUrl = this.configService.getOrThrow("supabase.url");
		const serviceRoleKey = this.configService.getOrThrow(
			"supabase.serviceRoleKey",
		);

		const apiUrl = `${supabaseUrl}/storage/v1/object/sign/${bucketName}`;

		try {
			const response = await fetch(apiUrl, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${serviceRoleKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ paths: filePaths, expiresIn }),
			});

			if (!response.ok) {
				throw new Error(
					`Failed to generate signed URLs: ${response.statusText}`,
				);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			console.error("Error generating signed URLs:", error);
			throw error;
		}
	}

	getPublicUrl(bucketName: string, filePath: string): string {
		const supabaseUrl = this.configService.getOrThrow("supabase.url");
		return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
	}
}
