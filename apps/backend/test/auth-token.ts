import { createHmac } from "node:crypto";

function base64UrlEncode(input: string | Buffer): string {
	const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
	return buffer
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");
}

export function createAuthToken(userId: string): string {
	const nowInSeconds = Math.floor(Date.now() / 1000);
	const secret = process.env.SUPABASE_JWT_SECRET ?? "test-supabase-jwt-secret";

	const header = {
		alg: "HS256",
		typ: "JWT",
	};

	const payload = {
		sub: userId,
		role: "authenticated",
		iat: nowInSeconds,
		exp: nowInSeconds + 60 * 60,
	};

	const encodedHeader = base64UrlEncode(JSON.stringify(header));
	const encodedPayload = base64UrlEncode(JSON.stringify(payload));
	const data = `${encodedHeader}.${encodedPayload}`;
	const signature = createHmac("sha256", secret).update(data).digest();
	const encodedSignature = base64UrlEncode(signature);

	return `${data}.${encodedSignature}`;
}
