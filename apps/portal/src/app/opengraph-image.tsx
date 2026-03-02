import { ImageResponse } from "next/og";

export const alt = "DALI Portal — Sangguniang Panlungsod ng Iloilo";
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
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#f8fafc",
				backgroundImage:
					"radial-gradient(circle at 25px 25px, #e2e8f0 2%, transparent 0%), radial-gradient(circle at 75px 75px, #e2e8f0 2%, transparent 0%)",
				backgroundSize: "100px 100px",
			}}
		>
			{/* Top accent bar */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					height: "8px",
					backgroundColor: "#a60202",
				}}
			/>

			{/* Seal */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					marginBottom: 40,
				}}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={`${baseUrl}/iloilo-city-seal.png`}
					height="120"
					width="120"
					alt="City Seal"
					style={{ margin: "0 20px" }}
				/>
			</div>

			{/* Text */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<div
					style={{
						fontSize: 52,
						fontWeight: 800,
						color: "#0f172a",
						letterSpacing: "-0.025em",
					}}
				>
					Sangguniang Panlungsod ng Iloilo
				</div>
				<div
					style={{
						fontSize: 28,
						fontWeight: 500,
						color: "#475569",
						marginTop: 10,
					}}
				>
					Official Public Portal
				</div>
			</div>

			{/* Footer badge */}
			<div
				style={{
					position: "absolute",
					bottom: 40,
					display: "flex",
					alignItems: "center",
					gap: "12px",
					backgroundColor: "#a60202",
					color: "white",
					padding: "10px 30px",
					borderRadius: 50,
					fontSize: 20,
				}}
			>
				DALI Portal
			</div>
		</div>,
		{ ...size },
	);
}
