import { ImageResponse } from "next/og";

import {
	getCachedLegislativeDocumentById,
	parseLegislativeDocumentId,
} from "./document-detail-data";

export const alt = "Legislative Document Details";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function Image({ params }: Props) {
	const { id } = await params;
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

	const idNum = parseLegislativeDocumentId(id);
	let documentType = "Document";
	let officialNumber = "Legislative Document";
	let title = "View Details";
	let dateText = "";

	if (idNum !== null) {
		const { error, data } = await getCachedLegislativeDocumentById(idNum);

		if (!error && data) {
			documentType = data.type === "ordinance" ? "Ordinance" : "Resolution";
			officialNumber = data.officialNumber;
			title = data.displayTitle || data.document?.title || "Untitled Document";
			dateText = new Date(data.dateEnacted).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		}
	}

	const accentColor = documentType === "Ordinance" ? "#2563eb" : "#16a34a";
	const pillBg = documentType === "Ordinance" ? "#eff6ff" : "#f0fdf4";
	const pillText = documentType === "Ordinance" ? "#1d4ed8" : "#166534";

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
			{/* Left accent bar — blue for ordinance, amber for resolution */}
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
				{/* Header */}
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
							backgroundColor: pillBg,
							color: pillText,
							borderRadius: "99px",
							fontSize: 24,
							fontWeight: 600,
							textTransform: "uppercase",
						}}
					>
						{documentType}
					</div>
					{dateText && (
						<div
							style={{
								fontSize: 24,
								color: "#64748b",
							}}
						>
							{dateText}
						</div>
					)}
				</div>

				{/* Main title */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "10px",
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
						{officialNumber}
					</div>
					<div
						style={{
							fontSize: 32,
							color: "#334155",
							lineHeight: 1.4,
							maxHeight: "180px",
							overflow: "hidden",
						}}
					>
						{title}
					</div>
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
							Legislative Records
						</div>
					</div>
				</div>
			</div>
		</div>,
		{ ...size },
	);
}
