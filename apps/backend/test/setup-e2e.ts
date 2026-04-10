import { afterAll, afterEach, beforeAll, jest } from "@jest/globals";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { config as loadEnv } from "dotenv";
import { AppModule } from "../src/app/app.module";
import { RolesGuard } from "../src/app/auth/guards/roles.guard";
import { SupabaseAdminService } from "../src/app/util/supabase/supabase-admin.service";
import {
	assertSafeTestEnvironment,
	createTestPrismaClient,
	resetPublicSchema,
} from "./database";

loadEnv({ path: ".env.test" });

Reflect.set(process.env, "NODE_ENV", "test");
process.env.SUPABASE_JWT_SECRET ??= "test-supabase-jwt-secret";
process.env.SUPABASE_URL ??= "http://127.0.0.1:54321";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
if (!process.env.DATABASE_URL && process.env.TEST_DATABASE_URL) {
	process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

const supabaseClientMock = {
	auth: {
		admin: {
			inviteUserByEmail: jest.fn(),
			deleteUser: jest.fn(),
		},
		resetPasswordForEmail: jest.fn(),
	},
};

const supabaseAdminServiceMock = {
	getClient: jest.fn(() => supabaseClientMock),
};

const prisma = createTestPrismaClient();
let app: INestApplication;

beforeAll(async () => {
	assertSafeTestEnvironment();
	await resetPublicSchema(prisma);

	const moduleRef = await Test.createTestingModule({
		imports: [AppModule],
	})
		.overrideProvider(SupabaseAdminService)
		.useValue(supabaseAdminServiceMock)
		.compile();

	app = moduleRef.createNestApplication();
	await app.init();
});

afterEach(async () => {
	RolesGuard.clearCache();
	jest.clearAllMocks();
	await resetPublicSchema(prisma);
});

afterAll(async () => {
	await app.close();
	await prisma.$disconnect();
});

export function getHttpServer() {
	return app.getHttpServer();
}

export { prisma, supabaseClientMock };
