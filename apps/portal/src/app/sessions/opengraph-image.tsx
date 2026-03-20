import { ImageResponse } from "next/og";

export const alt = "Council Sessions — Iloilo City";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	return new ImageResponse(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: "56px",
				background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
				borderLeft: "24px solid #a60202",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={`${baseUrl}/iloilo-city-seal.png`}
					width="72"
					height="72"
					alt="Iloilo City Seal"
				/>
				<div style={{ fontSize: 24, color: "#64748b", fontWeight: 600 }}>
					Sangguniang Panlungsod ng Iloilo
				</div>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
				<div style={{ fontSize: 64, fontWeight: 800, color: "#0f172a" }}>
					Council Sessions
				</div>
				<div style={{ fontSize: 32, color: "#475569" }}>
					Schedules, agendas, and session details
				</div>
			</div>

			<div
				style={{
					fontSize: 20,
					fontWeight: 700,
					color: "#a60202",
					textTransform: "uppercase",
					letterSpacing: "0.08em",
				}}
			>
				DALI Portal
			</div>
		</div>,
		{ ...size },
	);
}
