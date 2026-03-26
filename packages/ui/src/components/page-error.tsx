import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

interface PageErrorProps {
	/** Primary error heading shown to the user. */
	title?: string;
	/** Supplementary explanation below the heading. */
	description?: string;
	/**
	 * Raw detail from the API error (e.g. `error.message`). Displayed in a
	 * subtle monospace block — omit in production if the message contains
	 * internal detail you don't want citizens to see.
	 */
	detail?: string;
	/** Optional CTA — pass a `<Link>` / `<Button>` or any element. */
	action?: ReactNode;
}

/**
 * Full-height centered error state for page-level API failures.
 *
 * @example
 * ```tsx
 * import { PageError } from "@repo/ui/components/page-error";
 *
 * <PageError
 *   title="Unable to Load Sessions"
 *   description="We're experiencing technical difficulties. Please try again."
 *   detail={isDefinedError(error) ? error.message : undefined}
 *   action={
 *     <Link href="/sessions">
 *       <Button variant="outline" size="sm">Try Again</Button>
 *     </Link>
 *   }
 * />
 * ```
 */
export function PageError({
	title = "Something went wrong",
	description,
	detail,
	action,
}: PageErrorProps) {
	return (
		<div className="w-full rounded-xl border border-red-200 bg-red-50 p-6 sm:p-8">
			<div className="flex flex-col items-center text-center">
				<span className="mb-3 flex size-11 items-center justify-center rounded-full bg-red-100 sm:size-12">
					<AlertCircle
						className="size-5 text-red-600 sm:size-6"
						aria-hidden="true"
					/>
				</span>
				<p className="text-sm font-semibold text-red-900">{title}</p>
				{description && (
					<p className="mt-1.5 max-w-prose text-xs text-red-700 sm:text-sm">
						{description}
					</p>
				)}
				{detail && (
					<p className="mt-3 max-w-prose wrap-break-word rounded-lg border border-red-100 bg-white/60 px-3 py-2 font-mono text-xs text-red-500">
						{detail}
					</p>
				)}
				{action && <div className="mt-5">{action}</div>}
			</div>
		</div>
	);
}
