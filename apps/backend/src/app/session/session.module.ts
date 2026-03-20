import { Module } from "@nestjs/common";
import { SessionManagementModule } from "./session-management/session-management.module";
import { SessionPortalModule } from "./session-portal/session-portal.module";

/**
 * Aggregate module that re-exports both portal (public) and management (admin)
 * session sub-modules. Import this single module in AppModule.
 */
@Module({
	imports: [SessionPortalModule, SessionManagementModule],
	exports: [SessionPortalModule, SessionManagementModule],
})
export class SessionModule {}
