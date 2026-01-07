import { Injectable } from "@nestjs/common";
import { ConfigService } from "@/lib/config.service";

interface SignedUrlResponse {
	path: string;
	signedURL: string;
	error?: string;
}

interface SignedUrlResult {
	path: string;
	signedUrl: string;
}

@Injectable()
export class StorageService {
	constructor(private readonly configService: ConfigService) {}

	private getSupabaseConfig() {
		return {
			url: this.configService.getOrThrow("supabase.url"),
			serviceRoleKey: this.configService.getOrThrow("supabase.serviceRoleKey"),
		};
	}

	async getSignedUrl(
		bucketName: string,
		filePath: string,
		expiresIn = 3600,
	): Promise<string> {
		const { url: supabaseUrl, serviceRoleKey } = this.getSupabaseConfig();
		const apiUrl = `${supabaseUrl}/storage/v1/object/sign/${bucketName}`;

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
	}

	async getSignedUrls(
		bucketName: string,
		filePaths: string[],
		expiresIn = 3600, //1 hour
	): Promise<SignedUrlResult[]> {
		const { url: supabaseUrl, serviceRoleKey } = this.getSupabaseConfig();
		const apiUrl = `${supabaseUrl}/storage/v1/object/sign/${bucketName}`;

		const response = await fetch(apiUrl, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${serviceRoleKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ paths: filePaths, expiresIn }),
		});

		if (!response.ok) {
			throw new Error(`Failed to generate signed URLs: ${response.statusText}`);
		}

		const data: SignedUrlResponse[] = await response.json();

		return data.map((item) => ({
			path: item.path,
			signedUrl: `${supabaseUrl}/storage/v1${item.signedURL}`,
		}));
	}

	getPublicUrl(bucketName: string, filePath: string): string {
		const { url: supabaseUrl } = this.getSupabaseConfig();
		return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
	}
}
