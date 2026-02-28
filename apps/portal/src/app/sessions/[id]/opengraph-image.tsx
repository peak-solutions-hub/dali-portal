import { ImageResponse } from "next/og";

import { api } from "@/lib/api.client";

export const alt = "Council Session Details";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SESSION_TYPE_LABELS: Record<string, string> = {
	regular: "Regular Session",
	special: "Special Session",
};

const SESSION_STATUS_LABELS: Record<string, string> = {
	scheduled: "Scheduled",
	completed: "Completed",
};

interface Props {
	params: Promise<{ id: string }>;
}

export default async function Image({ params }: Props) {
	const { id } = await params;
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

	let sessionNumber = "";
	let sessionType = "Council Session";
	let sessionStatus = "";
	let dateText = "";
	let timeText = "";

	if (uuidRegex.test(id)) {
		const [error, data] = await api.sessions.getById({ id });

		if (!error && data) {
			sessionNumber = `Session #${data.sessionNumber}`;
			sessionType = SESSION_TYPE_LABELS[data.type] || data.type;
			sessionStatus = SESSION_STATUS_LABELS[data.status] || data.status;

			const date = new Date(data.scheduleDate);
			dateText = date.toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			});
			timeText = date.toLocaleTimeString("en-US", {
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
			});
		}
	}

	const isSpecial = sessionType === "Special Session";
	const accentColor = isSpecial ? "#fe9a00" : "#a60202";
	const typePillBg = isSpecial ? "#fffbeb" : "#fef2f2";
	const typePillText = isSpecial ? "#b45309" : "#991b1b";

	const statusColor = sessionStatus === "Completed" ? "#16a34a" : "#3b82f6";

	return new ImageResponse(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "row",
				backgroundColor: "#ffffff",
			}}
		>
			{/* Left accent bar */}
			<div
				style={{
					width: "24px",
					height: "100%",
					backgroundColor: accentColor,
				}}
			/>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					padding: "60px",
					width: "100%",
				}}
			>
				{/* Header pills */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "16px",
					}}
				>
					<div
						style={{
							padding: "8px 24px",
							backgroundColor: typePillBg,
							color: typePillText,
							borderRadius: "99px",
							fontSize: 24,
							fontWeight: 600,
							textTransform: "uppercase",
						}}
					>
						{sessionType}
					</div>
					{sessionStatus && (
						<div
							style={{
								padding: "8px 24px",
								backgroundColor: "#f8fafc",
								color: statusColor,
								borderRadius: "99px",
								fontSize: 22,
								fontWeight: 600,
								border: `2px solid ${statusColor}`,
							}}
						>
							{sessionStatus}
						</div>
					)}
				</div>

				{/* Main content */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "12px",
					}}
				>
					<div
						style={{
							fontSize: 64,
							fontWeight: 800,
							color: "#0f172a",
							lineHeight: 1.1,
						}}
					>
						{sessionNumber || "Council Session"}
					</div>
					{dateText && (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "16px",
								fontSize: 28,
								color: "#475569",
							}}
						>
							<span>{dateText}</span>
							{timeText && (
								<span
									style={{
										color: "#94a3b8",
									}}
								>
									•
								</span>
							)}
							{timeText && <span>{timeText}</span>}
						</div>
					)}
				</div>

				{/* Footer */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "20px",
					}}
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={`${baseUrl}/iloilo-city-seal.png`}
						width="56"
						height="56"
						alt="Seal"
					/>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
						}}
					>
						<div
							style={{
								fontSize: 22,
								fontWeight: 700,
								color: "#0f172a",
							}}
						>
							Sangguniang Panlungsod ng Iloilo
						</div>
						<div
							style={{
								fontSize: 16,
								color: "#64748b",
							}}
						>
							Council Sessions
						</div>
					</div>
				</div>
			</div>
		</div>,
		{ ...size },
	);
}
