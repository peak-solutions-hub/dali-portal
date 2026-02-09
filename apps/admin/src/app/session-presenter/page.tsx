"use client";

import { useSearchParams } from "next/navigation";
import React from "react";
import { PresenterWindow } from "@/components/session-management/presenter/presenter-window";

export default function SessionPresenterPage() {
	const params = useSearchParams();
	const sessionId = params.get("session") ?? "unknown";

	return <PresenterWindow sessionId={sessionId} />;
}
