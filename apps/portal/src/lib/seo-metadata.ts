import type { Metadata } from "next";

export const SITE_TITLE = "DALI Portal — Sangguniang Panlungsod ng Iloilo";
export const SITE_TITLE_SHORT = "DALI Portal";

export const SITE_DESCRIPTION =
	"Official public portal of the Sangguniang Panlungsod ng Iloilo. Access legislative documents, council sessions, and citizen inquiry services.";

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

export const OG_IMAGE_SIZE = {
	width: 1200,
	height: 630,
} as const;

export function createOgImageMeta(
	url: string,
	alt: string,
): NonNullable<Metadata["openGraph"]>["images"] {
	return [
		{
			url,
			width: OG_IMAGE_SIZE.width,
			height: OG_IMAGE_SIZE.height,
			alt,
		},
	];
}

/**
 * Truncates a description string to fit within the recommended 160-character
 * meta description limit, breaking at the previous sentence boundary (`.`)
 * first, then at the previous word boundary if no sentence break is found.
 */
export function truncateDescription(text: string, maxLen = 160): string {
	if (text.length <= maxLen) return text;

	const sliced = text.substring(0, maxLen);

	// Prefer ending at a sentence boundary (last '.' within the slice)
	const lastDot = sliced.lastIndexOf(".");
	if (lastDot > maxLen * 0.5) {
		return sliced.substring(0, lastDot + 1);
	}

	// Fall back to the last word boundary
	const lastSpace = sliced.lastIndexOf(" ");
	if (lastSpace > 0) {
		return `${sliced.substring(0, lastSpace)}…`;
	}

	// Hard cap as last resort
	return `${sliced}…`;
}

export function createPageMetadata({
	title,
	description,
	url,
	ogType = "website",
	imagePath = "/opengraph-image",
	ogExtra,
}: {
	title: string;
	description: string;
	url: string;
	ogType?: "website" | "article";
	imagePath?: string;
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
			images: createOgImageMeta(imagePath, title),
			// spread any extras last so callers can override defaults
			...ogExtra,
		},
		twitter: {
			...BASE_TWITTER,
			title,
			description,
			images: [imagePath],
		},
	};
}
