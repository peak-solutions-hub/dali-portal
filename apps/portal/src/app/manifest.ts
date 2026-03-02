import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "DALI Portal — Sangguniang Panlungsod ng Iloilo",
		short_name: "DALI Portal",
		description:
			"Official public portal of the Sangguniang Panlungsod ng Iloilo (Iloilo City Council). Access legislative documents, council sessions, and citizen inquiry services.",
		start_url: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#a60202",
		icons: [
			{
				src: "/favicon.ico",
				sizes: "any",
				type: "image/x-icon",
			},
		],
	};
}
