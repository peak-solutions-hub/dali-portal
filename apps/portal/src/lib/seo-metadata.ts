import type { Metadata } from "next";

export const SITE_TITLE = "DALI Portal — Sangguniang Panlungsod ng Iloilo";
export const SITE_TITLE_SHORT = "DALI Portal";

export const SITE_DESCRIPTION =
	"Official public portal of the Sangguniang Panlungsod ng Iloilo (Iloilo City Council). Access legislative documents, council sessions, and citizen inquiry services.";

export const SITE_AUTHOR = "Iloilo City Vice Mayor's Office";

export const SITE_KEYWORDS = [
	"Iloilo City",
	"Sangguniang Panlungsod",
	"City Council",
	"Ordinances",
	"Resolutions",
	"Legislative Documents",
	"Council Sessions",
	"Vice Mayor",
	"Public Portal",
	"DALI",
] as const;

export const BASE_OPEN_GRAPH: NonNullable<Metadata["openGraph"]> = {
	type: "website",
	locale: "en_PH",
	siteName: SITE_TITLE,
};

export const BASE_TWITTER: NonNullable<Metadata["twitter"]> = {
	card: "summary_large_image",
};

export function createPageMetadata({
	title,
	description,
	url,
	ogType = "website",
	ogExtra,
}: {
	title: string;
	description: string;
	url: string;
	ogType?: "website" | "article";
	/**
	 * Additional open-graph fields that may not be included on every
	 * variant (e.g. `publishedTime` for articles). Accepts a partial of
	 * the full `Metadata["openGraph"]` type.
	 */
	ogExtra?: Partial<NonNullable<Metadata["openGraph"]>>;
}): Metadata {
	return {
		title,
		description,
		openGraph: {
			...BASE_OPEN_GRAPH,
			title,
			description,
			type: ogType,
			url,
			// spread any extras last so callers can override defaults
			...ogExtra,
		},
		twitter: {
			...BASE_TWITTER,
			title,
			description,
		},
	};
}
